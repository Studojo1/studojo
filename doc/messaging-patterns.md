# Messaging Patterns

## Overview

RabbitMQ is used for asynchronous job processing. The Control Plane publishes job commands, and workers consume them, process jobs, and publish results back.

## Exchange Architecture

### Jobs Exchange (`cp.jobs`)

Topic exchange for publishing job commands to workers.

- **Type**: Topic exchange
- **Durability**: Durable (survives broker restart)
- **Auto-delete**: False
- **Routing Key Pattern**: `job.<job-type>`

Examples:
- `job.assignment-gen`
- `job.outline-gen`
- `job.outline-edit`
- `job.resume-gen`
- `job.resume-optimize`

### Results Exchange (`cp.results`)

Topic exchange for publishing result events from workers back to Control Plane.

- **Type**: Topic exchange
- **Durability**: Durable
- **Auto-delete**: False
- **Routing Key Pattern**: `result.<job-type>`

Examples:
- `result.assignment-gen`
- `result.outline-gen`
- `result.resume-gen`

## Queue Naming Conventions

### Worker Queues

Queues are named after the service that consumes them:

- `assignment-gen.jobs` - Consumed by assignment-gen-worker
- `resume.jobs` - Consumed by resume-worker

Pattern: `<service-name>.jobs`

### Control Plane Queue

- `control-plane.results` - Consumed by Control Plane for result events

## Message Structures

### JobCommand

Published by Control Plane to workers:

```go
type JobCommand struct {
    JobID         string          `json:"job_id"`
    Type          string          `json:"type"`
    UserID        string          `json:"user_id"`
    Payload       json.RawMessage `json:"payload"`
    CorrelationID string          `json:"correlation_id"`
}
```

Fields:
- `job_id`: UUID of the job (string format)
- `type`: Job type (e.g., "assignment-gen", "resume-gen")
- `user_id`: User ID from JWT token
- `payload`: Job-specific payload as JSON
- `correlation_id`: UUID for request tracing

### ResultEvent

Published by workers to Control Plane:

```go
type ResultEvent struct {
    JobID         string          `json:"job_id"`
    Type          string          `json:"type"`
    Status        string          `json:"status"`
    Result        json.RawMessage `json:"result,omitempty"`
    Error         *string         `json:"error,omitempty"`
    CorrelationID string          `json:"correlation_id,omitempty"`
}
```

Fields:
- `job_id`: UUID of the job (must match JobCommand)
- `type`: Job type (must match JobCommand)
- `status`: "COMPLETED" or "FAILED"
- `result`: Result data as JSON (for COMPLETED)
- `error`: Error message string (for FAILED)
- `correlation_id`: Correlation ID from JobCommand

## Publishing Patterns

### Control Plane Publishing

```go
// Initialize publisher
cfg := messaging.DefaultConfig(rabbitURL)
pub, err := messaging.NewRabbitPublisher(cfg)

// Publish job command
cmd := &messaging.JobCommand{
    JobID:         jobID.String(),
    Type:          "assignment-gen",
    UserID:        userID,
    Payload:       payloadJSON,
    CorrelationID: uuid.New().String(),
}
err := pub.PublishJob(ctx, cmd)
```

The publisher:
- Declares the `cp.jobs` exchange if it doesn't exist
- Uses routing key `job.<type>` based on job type
- Sets `DeliveryMode: Persistent` for durability
- Uses `ContentType: application/json`

### Worker Publishing

```go
// Publish result event
routingKey := "result." + jobType
event := map[string]interface{}{
    "job_id":         jobID,
    "type":            jobType,
    "status":          "COMPLETED",
    "correlation_id":  correlationID,
}
if len(result) > 0 {
    var resultObj interface{}
    json.Unmarshal(result, &resultObj)
    event["result"] = resultObj
}
if errMsg != nil {
    event["error"] = *errMsg
}

body, _ := json.Marshal(event)
ch.PublishWithContext(ctx, resultsExchange, routingKey, false, false, amqp.Publishing{
    ContentType:  "application/json",
    Body:         body,
    DeliveryMode: amqp.Persistent,
})
```

## Consuming Patterns

### Worker Consumption

```go
// Connect to RabbitMQ
conn, err := amqp.Dial(rabbitURL)
ch, err := conn.Channel()

// Declare exchanges
ch.ExchangeDeclare("cp.jobs", "topic", true, false, false, false, nil)
ch.ExchangeDeclare(resultsExchange, "topic", true, false, false, false, nil)

// Declare queue
q, err := ch.QueueDeclare("service-name.jobs", true, false, false, false, nil)

// Bind to routing keys
for _, jobType := range []string{"job-type-1", "job-type-2"} {
    ch.QueueBind(q.Name, "job."+jobType, "cp.jobs", false, nil)
}

// Consume messages
deliveries, err := ch.Consume(q.Name, "consumer-tag", false, false, false, false, nil)

// Process messages
for d := range deliveries {
    var cmd JobCommand
    if err := json.Unmarshal(d.Body, &cmd); err != nil {
        d.Nack(false, false) // Reject and don't requeue
        continue
    }
    
    // Process job
    if err := processJob(ctx, cmd); err != nil {
        // Publish error result
        publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &err.Error())
        d.Ack(false)
        continue
    }
    
    // Publish success result
    publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "COMPLETED", resultJSON, nil)
    d.Ack(false)
}
```

### Control Plane Consumption

```go
// Initialize consumer
cfg := messaging.DefaultConfig(rabbitURL)
cfg.ResultsQueue = "control-plane.results"
cfg.ResultsBindKey = "result.#" // Bind to all result routing keys
consumer := messaging.NewRabbitConsumer(cfg, resultHandler)

// Run with retry
go messaging.RunWithRetry(ctx, consumer, 5*time.Second)
```

The consumer:
- Declares `cp.results` exchange
- Declares `control-plane.results` queue
- Binds queue with `result.#` to receive all result types
- Calls `ResultHandler.HandleResult()` for each event
- Acks after successful processing
- Nacks and requeues on processing errors

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

### All Result Types

```go
ch.QueueBind("queue-name", "result.#", "cp.results", false, nil)
```

## Message Acknowledgment

### Acknowledgment Strategy

- **Manual acknowledgment**: Always use `autoAck: false`
- **Ack after processing**: Ack only after successful processing
- **Nack on error**: Nack with requeue based on error type

### Acknowledgment Patterns

```go
// Success - ack and don't requeue
d.Ack(false)

// Transient error - nack and requeue
d.Nack(false, true)

// Permanent error - nack and don't requeue
d.Nack(false, false)
```

### When to Ack

- After successfully processing the job
- After publishing result event (success or failure)
- After handling invalid messages (nack without requeue)

### When to Nack

- Invalid message format: `d.Nack(false, false)` (don't requeue)
- Transient processing error: `d.Nack(false, true)` (requeue)
- Permanent processing error: Publish FAILED result, then `d.Ack(false)`

## Error Handling

### Invalid Messages

If a message cannot be unmarshaled or is invalid:

```go
if err := json.Unmarshal(d.Body, &cmd); err != nil {
    slog.Error("unmarshal failed", "error", err, "body", string(d.Body))
    d.Nack(false, false) // Don't requeue invalid messages
    return
}
```

### Processing Errors

If job processing fails:

```go
if err := processJob(ctx, cmd); err != nil {
    errMsg := err.Error()
    publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
    d.Ack(false) // Ack to remove from queue, error already published
    return
}
```

### Result Publishing Errors

If result publishing fails, log but still ack the message:

```go
if err := publishResult(...); err != nil {
    slog.Error("publish result failed", "job_id", jobID, "error", err)
    // Still ack - job is processed, result publishing can be retried separately
}
d.Ack(false)
```

## Retry Patterns

### Consumer Retry

Control Plane consumer uses retry logic:

```go
func RunWithRetry(ctx context.Context, consumer *RabbitConsumer, backoff time.Duration) {
    for {
        err := consumer.Run(ctx)
        if ctx.Err() != nil {
            return
        }
        slog.Warn("consumer stopped", "error", err, "retrying in", backoff)
        select {
        case <-ctx.Done():
            return
        case <-time.After(backoff):
            // Retry
        }
    }
}
```

### Worker Reconnection

Workers should handle connection loss:

```go
for {
    select {
    case <-ctx.Done():
        return
    case d, ok := <-deliveries:
        if !ok {
            slog.Warn("deliveries closed, reconnecting...")
            time.Sleep(5 * time.Second)
            // Reconnect logic
            return
        }
        go handleJob(ctx, ch, d, ...)
    }
}
```

## Message Durability

### Persistent Messages

All job commands and result events use persistent delivery:

```go
amqp.Publishing{
    DeliveryMode: amqp.Persistent, // Survives broker restart
    ContentType:  "application/json",
    Body:         body,
}
```

### Durable Queues

All queues are declared as durable:

```go
ch.QueueDeclare("queue-name", true, false, false, false, nil)
//              durable, exclusive, autoDelete, noWait, args
```

### Durable Exchanges

All exchanges are declared as durable:

```go
ch.ExchangeDeclare("exchange-name", "topic", true, false, false, false, nil)
//                 name, type, durable, autoDelete, internal, noWait, args
```

## Best Practices

1. **Always declare exchanges and queues**: Don't assume they exist
2. **Use persistent delivery**: Ensure messages survive broker restarts
3. **Handle connection loss**: Implement reconnection logic
4. **Ack after processing**: Never ack before work is complete
5. **Publish results for all outcomes**: Both success and failure
6. **Use correlation IDs**: For tracing requests across services
7. **Log message processing**: Include job_id and correlation_id
8. **Handle invalid messages**: Nack without requeue
9. **Clean up resources**: Close connections on shutdown
10. **Use structured logging**: Include context in all log messages




