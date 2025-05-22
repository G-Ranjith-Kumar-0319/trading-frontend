import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const API_URL = "https://trading-backend-30g5.onrender.com/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function App() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [updateNotification, setUpdateNotification] = useState(false);

  const columns = [
    {
      field: "ticker",
      headerName: "Ticker",
      width: 130,
      valueGetter: (params) => params.row.ticker || "N/A",
    },
    {
      field: "timenow",
      headerName: "Timestamp",
      width: 200,
      valueGetter: (params) => {
        try {
          return format(new Date(params.row.timenow), "PPpp");
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
    {
      field: "message",
      headerName: "Message",
      width: 200,
      valueGetter: (params) => params.row.message || "No message",
    },
    {
      field: "open",
      headerName: "Open",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.open;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toString();
      },
    },
    {
      field: "high",
      headerName: "High",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.high;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toString();
      },
    },
    {
      field: "low",
      headerName: "Low",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.low;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toString();
      },
    },
    {
      field: "close",
      headerName: "Close",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.close;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toString();
      },
    },
    {
      field: "price",
      headerName: "Price",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.price;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toString();
      },
    },
    {
      field: "volume",
      headerName: "Volume",
      width: 130,
      type: "number",
      valueGetter: (params) => {
        const value = params.row.volume;
        return value !== null && value !== undefined ? value : 0;
      },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "0";
        return params.value.toLocaleString();
      },
    },
    {
      field: "u_interval",
      headerName: "Interval",
      width: 100,
      valueGetter: (params) => params.row.u_interval || "N/A",
    },
    {
      field: "time",
      headerName: "Created At",
      width: 200,
      valueGetter: (params) => {
        try {
          return format(new Date(params.row.time), "PPpp");
        } catch (error) {
          return "Invalid Date";
        }
      },
    },
  ];

  const validateEventData = (data) => {
    if (!Array.isArray(data)) {
      throw new Error("Invalid data format: Expected an array");
    }

    return data.map((event, index) => {
      // Ensure all required fields have valid values
      const validatedEvent = {
        id: event.id || `temp-${index}`,
        ticker: String(event.ticker || "N/A").trim(),
        message: String(event.message || "").trim(),
        timenow: event.timenow || new Date().toISOString(),
        open: event.open !== null && event.open !== undefined ? event.open : 0,
        high: event.high !== null && event.high !== undefined ? event.high : 0,
        low: event.low !== null && event.low !== undefined ? event.low : 0,
        close:
          event.close !== null && event.close !== undefined ? event.close : 0,
        price:
          event.price !== null && event.price !== undefined ? event.price : 0,
        volume:
          event.volume !== null && event.volume !== undefined
            ? event.volume
            : 0,
        u_interval: String(event.u_interval || "").trim(),
        time: event.time || new Date().toISOString(),
      };

      return validatedEvent;
    });
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/events`);

      if (!response.data) {
        throw new Error("No data received from the server");
      }

      const validatedData = validateEventData(response.data);
      setEvents(validatedData);
      setError(null);
      setRetryCount(0);
      setUpdateNotification(true);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message || "Failed to fetch events");

      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchEvents();
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 1000 * 60);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const filteredEvents = events.filter((event) => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    const tickerMatch = (event.ticker || "")
      .toLowerCase()
      .includes(searchTermLower);
    const messageMatch = (event.message || "")
      .toLowerCase()
      .includes(searchTermLower);
    return tickerMatch || messageMatch;
  });

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseUpdateNotification = () => {
    setUpdateNotification(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          TradingView Webhook Dashboard
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by ticker or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredEvents}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: "timestamp", sort: "desc" }],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id}
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
              },
            }}
          />
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseError}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={updateNotification}
          autoHideDuration={3000}
          onClose={handleCloseUpdateNotification}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseUpdateNotification}
            severity="success"
            sx={{ width: "100%" }}
          >
            Table data is updated!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default App;