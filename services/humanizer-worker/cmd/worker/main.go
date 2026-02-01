package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/studojo/humanizer-worker/internal/blob"
	"github.com/studojo/humanizer-worker/internal/humanizer"
)

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}
	resultsExchange := os.Getenv("RESULTS_EXCHANGE")
	if resultsExchange == "" {
		resultsExchange = "cp.results"
	}
	azureAccountName := os.Getenv("AZURE_STORAGE_ACCOUNT_NAME")
	azureAccountKey := os.Getenv("AZURE_STORAGE_ACCOUNT_KEY")
	azureContainerName := os.Getenv("AZURE_STORAGE_CONTAINER_NAME")
	if azureContainerName == "" {
		azureContainerName = "humanizer"
	}
	useLocalstack := os.Getenv("USE_LOCALSTACK") == "true"
	localstackEndpoint := os.Getenv("LOCALSTACK_ENDPOINT")
	if localstackEndpoint == "" {
		localstackEndpoint = "http://localstack:4566"
	}
	humanizerServiceURL := os.Getenv("HUMANIZER_SERVICE_URL")
	if humanizerServiceURL == "" {
		humanizerServiceURL = "http://humanizer-svc:8000"
	}

	// Setup blob storage
	var blobClient blob.Client
	var err error
	if useLocalstack {
		blobClient, err = blob.NewLocalstackClient(localstackEndpoint, azureAccountName, azureAccountKey, azureContainerName)
	} else {
		blobClient, err = blob.NewAzureClient(azureAccountName, azureAccountKey, azureContainerName)
	}
	if err != nil {
		slog.Error("blob client init failed", "error", err)
		os.Exit(1)
	}

	// Setup humanizer service client
	humanizerClient := humanizer.NewClient(humanizerServiceURL)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// Connect to RabbitMQ
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		slog.Error("amqp dial failed", "error", err)
		os.Exit(1)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		slog.Error("amqp channel failed", "error", err)
		os.Exit(1)
	}
	defer ch.Close()

	// Declare exchange and queue
	if err := ch.ExchangeDeclare("cp.jobs", "topic", true, false, false, false, nil); err != nil {
		slog.Error("declare jobs exchange failed", "error", err)
		os.Exit(1)
	}
	if err := ch.ExchangeDeclare(resultsExchange, "topic", true, false, false, false, nil); err != nil {
		slog.Error("declare results exchange failed", "error", err)
		os.Exit(1)
	}

	// Declare queue for humanizer jobs
	q, err := ch.QueueDeclare("humanizer.jobs", true, false, false, false, nil)
	if err != nil {
		slog.Error("declare queue failed", "error", err)
		os.Exit(1)
	}
	// Bind to humanizer routing key
	if err := ch.QueueBind(q.Name, "job.humanizer", "cp.jobs", false, nil); err != nil {
		slog.Error("bind queue failed", "error", err, "job_type", "humanizer")
		os.Exit(1)
	}

	deliveries, err := ch.Consume(q.Name, "humanizer-worker", false, false, false, false, nil)
	if err != nil {
		slog.Error("consume failed", "error", err)
		os.Exit(1)
	}

	slog.Info("humanizer worker started", "queue", q.Name)

	for {
		select {
		case <-ctx.Done():
			slog.Info("worker shutting down")
			return
		case d, ok := <-deliveries:
			if !ok {
				slog.Warn("deliveries closed, reconnecting...")
				time.Sleep(5 * time.Second)
				return
			}
			go handleJob(ctx, ch, d, humanizerClient, blobClient, resultsExchange)
		}
	}
}

type JobCommand struct {
	JobID         string          `json:"job_id"`
	Type          string          `json:"type"`
	UserID        string          `json:"user_id"`
	Payload       json.RawMessage `json:"payload"`
	CorrelationID string          `json:"correlation_id"`
}

func handleJob(ctx context.Context, ch *amqp.Channel, d amqp.Delivery,
	humanizerClient *humanizer.Client, blobClient blob.Client, resultsExchange string) {
	var cmd JobCommand
	if err := json.Unmarshal(d.Body, &cmd); err != nil {
		slog.Error("unmarshal job command failed", "error", err, "body", string(d.Body))
		_ = d.Nack(false, false)
		return
	}

	slog.Info("processing job", "job_id", cmd.JobID, "type", cmd.Type)

	if cmd.Type != "humanizer" {
		slog.Error("unknown job type", "job_id", cmd.JobID, "type", cmd.Type)
		errMsg := fmt.Sprintf("unknown job type: %s", cmd.Type)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	// Parse payload
	var payloadMap map[string]interface{}
	if err := json.Unmarshal(cmd.Payload, &payloadMap); err != nil {
		slog.Error("unmarshal payload failed", "job_id", cmd.JobID, "error", err)
		errMsg := fmt.Sprintf("invalid payload: %v", err)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	// Get file data from payload (base64 encoded)
	fileData, ok := payloadMap["file_data"].(string)
	if !ok {
		slog.Error("no file_data in payload", "job_id", cmd.JobID)
		errMsg := "file_data (base64) required in payload"
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	// Decode base64 and save to temp file
	decoded, err := base64.StdEncoding.DecodeString(fileData)
	if err != nil {
		slog.Error("base64 decode failed", "job_id", cmd.JobID, "error", err)
		errMsg := fmt.Sprintf("invalid base64 file data: %v", err)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	tmpFile, err := os.CreateTemp("", "humanizer-input-*.docx")
	if err != nil {
		slog.Error("create temp file failed", "job_id", cmd.JobID, "error", err)
		errMsg := fmt.Sprintf("create temp file failed: %v", err)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}
	filePath := tmpFile.Name()
	defer os.Remove(filePath)

	_, err = tmpFile.Write(decoded)
	tmpFile.Close()
	if err != nil {
		slog.Error("write temp file failed", "job_id", cmd.JobID, "error", err)
		errMsg := fmt.Sprintf("write temp file failed: %v", err)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	// Call humanizer service
	humanizedPath, result, err := humanizerClient.Humanize(ctx, filePath)
	if err != nil {
		slog.Error("humanization failed", "job_id", cmd.JobID, "error", err)
		errMsg := err.Error()
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}
	defer os.Remove(humanizedPath)

	// Upload to blob storage
	downloadURL, err := blobClient.Upload(ctx, cmd.JobID, humanizedPath)
	if err != nil {
		slog.Error("upload failed", "job_id", cmd.JobID, "error", err)
		errMsg := fmt.Sprintf("upload failed: %v", err)
		publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "FAILED", nil, &errMsg)
		_ = d.Ack(false)
		return
	}

	// Publish success result
	resultJSON, _ := json.Marshal(map[string]interface{}{
		"download_url":         downloadURL,
		"paragraphs_processed":  result.ParagraphsProcessed,
		"paragraphs_humanized": result.ParagraphsHumanized,
		"paragraphs_reverted":   result.ParagraphsReverted,
	})
	publishResult(ch, resultsExchange, cmd.JobID, cmd.Type, cmd.CorrelationID, "COMPLETED", resultJSON, nil)
	_ = d.Ack(false)
	slog.Info("job completed", "job_id", cmd.JobID, "download_url", downloadURL)
}

func publishResult(ch *amqp.Channel, exchange, jobID, jobType, correlationID, status string, result []byte, errMsg *string) {
	routingKey := "result." + jobType
	event := map[string]interface{}{
		"job_id":         jobID,
		"type":            jobType,
		"status":          status,
		"correlation_id":  correlationID,
	}
	if len(result) > 0 {
		var resultObj interface{}
		if err := json.Unmarshal(result, &resultObj); err == nil {
			event["result"] = resultObj
		} else {
			event["result"] = json.RawMessage(result)
		}
	}
	if errMsg != nil {
		event["error"] = *errMsg
	}
	body, err := json.Marshal(event)
	if err != nil {
		slog.Error("marshal result event failed", "job_id", jobID, "error", err)
		return
	}
	err = ch.PublishWithContext(context.Background(), exchange, routingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp.Persistent,
	})
	if err != nil {
		slog.Error("publish result failed", "job_id", jobID, "status", status, "error", err)
	} else {
		slog.Info("published result", "job_id", jobID, "status", status)
	}
}

