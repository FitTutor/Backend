import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server is running on port ${PORT}');
    console.log('Environment: ${process.env.NODE_ENV}');
    console.log('Health check: http://localhost:${PORT}/health');
    console.log('API endpoint: http://localhost:${PORT}/api');
})