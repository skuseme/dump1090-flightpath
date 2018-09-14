<?php
	error_reporting(E_ALL);
	ini_set('display_errors', 1);
	header("Access-Control-Allow-Origin: *\r\n");

	$json_data = file_get_contents("php://input");

	if(!json_decode($json_data)){
		die();
	}else{
		file_put_contents("data.json", $json_data);
	}
?>