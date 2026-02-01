package humanizer

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Client is an HTTP client for the humanizer service.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new humanizer service client.
func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = "http://humanizer-svc:8000"
	}
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// HumanizeResult contains the result of humanization.
type HumanizeResult struct {
	ParagraphsProcessed int `json:"paragraphs_processed"`
	ParagraphsHumanized int `json:"paragraphs_humanized"`
	ParagraphsReverted  int `json:"paragraphs_reverted"`
}

// Humanize sends a DOCX file to the humanizer service and returns the humanized file path.
func (c *Client) Humanize(ctx context.Context, inputPath string) (outputPath string, result *HumanizeResult, err error) {
	// Create multipart form
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Add file
	file, err := os.Open(inputPath)
	if err != nil {
		return "", nil, fmt.Errorf("open input file: %w", err)
	}
	defer file.Close()

	part, err := writer.CreateFormFile("file", filepath.Base(inputPath))
	if err != nil {
		return "", nil, fmt.Errorf("create form file: %w", err)
	}

	_, err = io.Copy(part, file)
	if err != nil {
		return "", nil, fmt.Errorf("copy file to form: %w", err)
	}

	err = writer.Close()
	if err != nil {
		return "", nil, fmt.Errorf("close writer: %w", err)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/humanize", &requestBody)
	if err != nil {
		return "", nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", nil, fmt.Errorf("humanizer service returned %d: %s", resp.StatusCode, string(body))
	}

	// Extract result metadata from headers
	result = &HumanizeResult{}
	if processed := resp.Header.Get("X-Paragraphs-Processed"); processed != "" {
		fmt.Sscanf(processed, "%d", &result.ParagraphsProcessed)
	}
	if humanized := resp.Header.Get("X-Paragraphs-Humanized"); humanized != "" {
		fmt.Sscanf(humanized, "%d", &result.ParagraphsHumanized)
	}
	if reverted := resp.Header.Get("X-Paragraphs-Reverted"); reverted != "" {
		fmt.Sscanf(reverted, "%d", &result.ParagraphsReverted)
	}

	// Save response to temp file
	tmpFile, err := os.CreateTemp("", "humanized-*.docx")
	if err != nil {
		return "", nil, fmt.Errorf("create temp file: %w", err)
	}
	defer tmpFile.Close()

	_, err = io.Copy(tmpFile, resp.Body)
	if err != nil {
		return "", nil, fmt.Errorf("save response: %w", err)
	}

	return tmpFile.Name(), result, nil
}

