<?php

require_once '../controller.php';
require_once '../utils.php';
require_once '../db.php';

class TestsLikeRouteController extends RouteController
{
    function get()
    {
        if (!array_key_exists("id", array: $_GET)) {
            JSONResponse(["error" => "Test not found"], 404);
        }

        return $this->getById($_GET["id"]);
    }

    function getById($id)
    {
        if (!is_numeric($id)) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT `likes` FROM `tests` WHERE `id` = ?");
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
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $id = $_GET["id"];

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "UPDATE `tests` SET `likes` = `likes` + 1 WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
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
        $stmt = mysqli_prepare($conn, "UPDATE `tests` SET `likes` = `likes` - 1 WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($id);
    }
}

$routeController = new TestsLikeRouteController;
$routeController->init();
