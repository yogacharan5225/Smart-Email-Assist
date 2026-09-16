import { useState } from 'react';
import './App.css';
import {
  TextField,
  Typography,
  Container,
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!emailContent.trim()) {
      setError('Please enter the original email content.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedReply('');
    setCopied(false);

    try {
      const response = await axios.post(`${API_URL}/api/email/generate`, {
        emailContent: emailContent.trim(),
        tone,
      });

      setGeneratedReply(
        typeof response.data === 'string'
          ? response.data
          : response.data?.reply || ''
      );
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        'Failed to generate the reply. Make sure the backend and Gemini API are configured correctly.';
      setError(message);
      console.error(requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReply) return;
    await navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        AI Email Reply Generator
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate a context-aware email reply with a tone that fits your message.
      </Typography>

      <Box sx={{ mx: { xs: 0, sm: 3 } }}>
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          label="Original email content"
          value={emailContent}
          onChange={(event) => setEmailContent(event.target.value)}
          sx={{ mb: 2 }}
          placeholder="Paste the email you received here..."
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="tone-label">Tone</InputLabel>
          <Select
            labelId="tone-label"
            value={tone}
            label="Tone"
            onChange={(event) => setTone(event.target.value)}
          >
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="formal">Formal</MenuItem>
            <MenuItem value="concise">Concise</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!emailContent.trim() || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Reply'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {generatedReply && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Reply
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={generatedReply}
            slotProps={{ input: { readOnly: true } }}
          />

          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Reply'}
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default App;
