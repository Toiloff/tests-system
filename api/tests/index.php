<?php

require_once '../controller.php';
require_once '../utils.php';
require_once '../db.php';
require_once '../models.php';

class TestsRouteController extends RouteController
{
    function get()
    {
        if (array_key_exists("id", array: $_GET)) {
            return $this->getById($_GET["id"]);
        }

        return $this->getAll();
    }

    function getAll()
    {
        $conn = openConnection();
        $result = mysqli_query($conn, "SELECT * FROM `tests` ORDER BY `likes` DESC");
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_close($conn);

        return JSONResponse($data, 200);
    }

    function getById($id)
    {
        if (!is_numeric($id)) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT * FROM `tests` WHERE `id` = ? ORDER BY `likes` DESC");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);
        if (!$data) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        return JSONResponse($data[0], 200);
    }

    function post()
    {
        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $testTitle = $body->title;
        Test::validateTitle($testTitle);
        $testDesc = Test::validateDesc($body->desc);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "INSERT INTO `tests` (`title`, `desc`, `likes`) VALUES (?, ?, 0)");
        mysqli_stmt_bind_param($stmt, "ss", $testTitle, $testDesc);
        mysqli_stmt_execute($stmt);

        $lastId = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($lastId);
    }

    function put()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $id = $_GET["id"];

        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $testTitle = $body->title;
        Test::validateTitle($testTitle);
        $testDesc = Test::validateDesc($body->desc);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "UPDATE `tests` SET `title` = ?, `desc` = ? WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "ssd", $testTitle, $testDesc, $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($id);
    }

    function delete()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $id = $_GET["id"];

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "DELETE FROM `tests` WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return JSONResponse(["result" => "success"], 200);
    }
}

$routeController = new TestsRouteController;
$routeController->init();
