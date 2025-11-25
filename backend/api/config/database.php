<?php
/**
 * Database Configuration
 * 
 * IMPORTANT: Update these credentials with your Hostinger database info
 * You can find these in cPanel > MySQL Databases
 */

class Database {
    // TODO: Update these with your Hostinger credentials
    private $host = "localhost";
    private $db_name = "mind_task_fusion"; // Your database name
    private $username = "root";    // Your MySQL username
    private $password = "";    // Empty password for local MySQL
    private $charset = "utf8mb4";
    
    public $conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }
}
?>
