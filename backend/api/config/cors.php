<?php
/**
 * CORS Configuration
 * Allows React frontend to communicate with PHP backend
 */

// Allow requests from your frontend domain
// TODO: Update with your actual domain after deployment
header("Access-Control-Allow-Origin: *"); // In production, replace * with your domain
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
