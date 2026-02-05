# Worker Patterns

## Overview

Workers are background services that consume jobs from RabbitMQ, process them, and publish results. They are stateless and horizontally scalable.

## Worker Lifecycle

### Initialization

1. Load environment variables
2. Initialize external clients (blob storage, generators, etc.)
3. Connect to RabbitMQ
4. Declare exchanges and queues
5. Bind queues to routing keys
6. Start consuming messages

### Processing Loop

1. Receive job command from RabbitMQ
2. Unmarshal job command
3. Process job based on type
4. Publish result event (success or failure)
5. Acknowledge message

### Shutdown

1. Stop accepting new messages
2. Finish processing current messages
3. Close RabbitMQ connections
4. Clean up resources

## Worker Structure

### Entry Point Pattern

```go
func main() {
    // 1. Load configuration
    rabbitURL := os.Getenv("RABBITMQ_URL")
    resultsExchange := os.Getenv("RESULTS_EXCHANGE")
    
    // 2. Initialize clients
    blobClient, err := blob.NewAzureClient(...)
    generator := generator.NewPythonGenerator(...)
    
    // 3. Setup signal handling
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer cancel()
    
    // 4. Connect to RabbitMQ
    conn, err := amqp.Dial(rabbitURL)
    defer conn.Close()
    ch, err := conn.Channel()
    defer ch.Close()
    
    // 5. Declare topology
    ch.ExchangeDeclare("cp.jobs", "topic", true, false, false, false, nil)
    ch.ExchangeDeclare(resultsExchange, "topic", true, false, false, false, nil)
    
    // 6. Declare and bind queue
    q, err := ch.QueueDeclare("service-name.jobs", true, false, false, false, nil)
    for _, jobType := range []string{"job-type-1", "job-type-2"} {
        ch.QueueBind(q.Name, "job."+jobType, "cp.jobs", false, nil)
    }
    
    // 7. Start consuming
    deliveries, err := ch.Consume(q.Name, "worker-name", false, false, false, false, nil)
    
    // 8. Process messages
    for {
        select {
        case <-ctx.Done():
            slog.Info("worker shutting down")
            return
        case d, ok := <-deliveries:
            if !ok {
                slog.Warn("deliveries closed")
                return
            }
            go handleJob(ctx, ch, d, generator, blobClient, resultsExchange)
        }
    }
}
```

## Job Processing

### Job Command Structure

```go
type JobCommand struct {
    JobID         string          `json:"job_id"`
    Type          string          `json:"type"`
    UserID        string          `json:"user_id"`
    Payload       json.RawMessage `json:"payload"`
    CorrelationID string          `json:"correlation_id"`
}
```

### Processing Function

```go
func handleJob(ctx context.Context, ch *amqp.Channel, d amqp.Delivery, 
    generator generator.Generator, blobClient blob.Client, resultsExchange string) {
    
    // 1. Unmarshal command
    var cmd JobCommand
    if err := json.Unmarshal(d.Body, &cmd); err != nil {
        slog.Error("unmarshal failed", "error", err)
        d.Nack(false, false) // Don't requeue invalid messages
        return
    }
    
    slog.Info("processing job", "job_id", cmd.JobID, "type", cmd.Type)
    
    // 2. Process based on type
    switch cmd.Type {
    case "job-type-1":
        result, err := processType1(ctx, cmd.Payload, generator)
        if err != nil {
            publishFailure(ch, resultsExchange, cmd, err)
            d.Ack(false)
            return
        }
        publishSuccess(ch, resultsExchange, cmd, result)
        d.Ack(false)
        
    case "job-type-2":
        // Handle other types
    }
}
```

## Result Publishing

### Success Result

```go
func publishSuccess(ch *amqp.Channel, exchange string, cmd JobCommand, result interface{}) {
    resultJSON, err := json.Marshal(result)
    if err != nil {
        slog.Error("marshal result failed", "job_id", cmd.JobID, "error", err)
        return
    }
    
    routingKey := "result." + cmd.Type
    event := map[string]interface{}{
        "job_id":         cmd.JobID,
        "type":            cmd.Type,
        "status":          "COMPLETED",
        "correlation_id":  cmd.CorrelationID,
    }
    
    var resultObj interface{}
    if err := json.Unmarshal(resultJSON, &resultObj); err == nil {
        event["result"] = resultObj
    } else {
        event["result"] = json.RawMessage(resultJSON)
    }
    
    body, _ := json.Marshal(event)
    ch.PublishWithContext(context.Background(), exchange, routingKey, false, false, amqp.Publishing{
        ContentType:  "application/json",
        Body:         body,
        DeliveryMode: amqp.Persistent,
    })
}
```

### Failure Result

```go
func publishFailure(ch *amqp.Channel, exchange string, cmd JobCommand, err error) {
    errMsg := err.Error()
    routingKey := "result." + cmd.Type
    event := map[string]interface{}{
        "job_id":         cmd.JobID,
        "type":            cmd.Type,
        "status":          "FAILED",
        "correlation_id":  cmd.CorrelationID,
        "error":           errMsg,
    }
    
    body, _ := json.Marshal(event)
    ch.PublishWithContext(context.Background(), exchange, routingKey, false, false, amqp.Publishing{
        ContentType:  "application/json",
        Body:         body,
        DeliveryMode: amqp.Persistent,
    })
}
```

## File Handling

### Temporary Files

Create temporary directories for file generation:

```go
tmpDir, err := os.MkdirTemp("", "service-name-")
if err != nil {
    return err
}
defer os.RemoveAll(tmpDir) // Always clean up

filePath := filepath.Join(tmpDir, "output.docx")
```

### File Upload

Upload files to blob storage:

```go
downloadURL, err := blobClient.Upload(ctx, cmd.JobID, filePath)
if err != nil {
    return fmt.Errorf("upload failed: %w", err)
}

// Include download URL in result
result := map[string]string{
    "download_url": downloadURL,
}
```

### Cleanup

Always clean up temporary files:

```go
defer func() {
    if filePath != "" {
        tmpDir := filepath.Dir(filePath)
        if strings.Contains(tmpDir, "service-name-") {
            if err := os.RemoveAll(tmpDir); err != nil {
                slog.Warn("cleanup failed", "dir", tmpDir, "error", err)
            }
        }
    }
}()
```

## Error Handling

### Invalid Messages

If message cannot be unmarshaled:

```go
if err := json.Unmarshal(d.Body, &cmd); err != nil {
    slog.Error("unmarshal failed", "error", err, "body", string(d.Body))
    d.Nack(false, false) // Don't requeue
    return
}
```

### Processing Errors

If job processing fails:

```go
result, err := processJob(ctx, cmd.Payload)
if err != nil {
    slog.Error("processing failed", "job_id", cmd.JobID, "error", err)
    errMsg := err.Error()
    publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
    d.Ack(false) // Ack to remove from queue
    return
}
```

### Result Publishing Errors

If result publishing fails, log but still ack:

```go
if err := publishResult(...); err != nil {
    slog.Error("publish result failed", "job_id", cmd.JobID, "error", err)
    // Still ack - job is processed
}
d.Ack(false)
```

## External Service Calls

### HTTP Clients

Use context-aware HTTP clients:

```go
func callExternalService(ctx context.Context, url string, payload []byte) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payload))
    if err != nil {
        return nil, err
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("service returned %d", resp.StatusCode)
    }
    
    return io.ReadAll(resp.Body)
}
```

### Subprocess Execution

Execute external processes with timeout:

```go
func executeCommand(ctx context.Context, command string, args []string, input []byte) ([]byte, error) {
    cmd := exec.CommandContext(ctx, command, args...)
    cmd.Stdin = bytes.NewReader(input)
    
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    if err := cmd.Run(); err != nil {
        return nil, fmt.Errorf("command failed: %w, stderr: %s", err, stderr.String())
    }
    
    return stdout.Bytes(), nil
}
```

## Resource Management

### Connection Cleanup

Always close connections:

```go
conn, err := amqp.Dial(rabbitURL)
if err != nil {
    return err
}
defer conn.Close()

ch, err := conn.Channel()
if err != nil {
    return err
}
defer ch.Close()
```

### Context Propagation

Pass context through processing:

```go
func handleJob(ctx context.Context, ...) {
    // Use ctx for all operations
    result, err := processJob(ctx, payload)
    downloadURL, err := blobClient.Upload(ctx, jobID, filePath)
}
```

### Graceful Shutdown

Handle shutdown signals:

```go
ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer cancel()

// In processing loop
select {
case <-ctx.Done():
    slog.Info("shutting down")
    return
case d := <-deliveries:
    go handleJob(ctx, ch, d, ...)
}
```

## Queue Binding Patterns

### Single Job Type

```go
ch.QueueBind("queue-name", "job.assignment-gen", "cp.jobs", false, nil)
```

### Multiple Job Types

```go
for _, jobType := range []string{"assignment-gen", "outline-gen", "outline-edit"} {
    ch.QueueBind("queue-name", "job."+jobType, "cp.jobs", false, nil)
}
```

## Logging

### Structured Logging

Use structured logging with context:

```go
slog.Info("processing job", 
    "job_id", cmd.JobID,
    "type", cmd.Type,
    "user_id", cmd.UserID,
)

slog.Error("processing failed",
    "job_id", cmd.JobID,
    "error", err,
)
```

### Correlation IDs

Include correlation ID in logs:

```go
slog.Info("job completed",
    "job_id", cmd.JobID,
    "correlation_id", cmd.CorrelationID,
)
```

## Best Practices

1. **Process jobs concurrently**: Use goroutines for parallel processing
2. **Always publish results**: Both success and failure
3. **Ack after publishing**: Never ack before result is published
4. **Clean up resources**: Remove temp files, close connections
5. **Handle errors gracefully**: Log errors and publish failure results
6. **Use context**: Pass context for cancellation/timeout
7. **Validate input**: Check job command structure before processing
8. **Log processing steps**: Include job_id and correlation_id
9. **Handle shutdown**: Stop accepting new jobs on shutdown
10. **Idempotent processing**: Ensure jobs can be safely retried
11. **Resource limits**: Set timeouts and limits for external calls
12. **Monitor processing time**: Log duration for performance tracking


























