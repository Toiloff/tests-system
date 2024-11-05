<?php

require_once '../../controller.php';
require_once '../../utils.php';
require_once '../../db.php';
require_once '../../models.php';

class TestQuestionsRouteController extends RouteController
{
    function get()
    {
        if (array_key_exists("id", array: $_GET)) {
            return $this->getById($_GET["id"]);
        }

        if (array_key_exists("test_id", array: $_GET)) {
            return $this->getByTestId($_GET["test_id"]);
        }

        return $this->getAll();
    }

    function getAll()
    {
        $conn = openConnection();
        $result = mysqli_query($conn, "SELECT * FROM `questions`");
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_close($conn);

        return JSONResponse($data, 200);
    }

    function getById($id)
    {
        if (!is_numeric($id)) {
            return JSONResponse(["error" => "Question not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, query: "SELECT q.id, q.title, q.test_id, a.id as answer_id, a.title as answer_title, a.score as answer_score, a.isRight as answer_isRight FROM `questions` q LEFT JOIN `answers` a ON a.question_id = q.id WHERE q.id = ? ORDER BY q.id, a.id");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);
        if (!$data) {
            return JSONResponse(["error" => "Question not found"], 404);
        }

        $result = [
            "id" => $data[0]["id"],
            "title" => $data[0]["title"],
            "test_id" => $data[0]["test_id"],
            "answers" => []
        ];
        if ($data[0]["answer_id"]) {
            foreach ($data as $key => $value) {
                array_push($result["answers"], [
                    "id" => $value["answer_id"],
                    "title" => $value["answer_title"],
                    "score" => $value["answer_score"],
                    "isRight" => $value["answer_isRight"] === 1,
                ]);
            }
        }

        return JSONResponse($result, 200);
    }

    function getByTestId($testId)
    {
        if (!is_numeric($testId)) {
            return JSONResponse(["error" => "Questions not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT q.id, q.title, q.test_id, a.id as answer_id, a.title as answer_title, a.score as answer_score, a.isRight as answer_isRight FROM `questions` q LEFT JOIN `answers` a ON a.question_id = q.id WHERE q.test_id = ? ORDER BY q.id, a.id");
        mysqli_stmt_bind_param($stmt, "d", $testId);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);
        if (!$data) {
            return JSONResponse(["error" => "Questions not found"], 404);
        }

        $result = [];
        foreach ($data as $value) {
            $resultItem = [
                "id" => $value["id"],
                "title" => $value["title"],
                "test_id" => $value["test_id"],
                "answers" => []
            ];
            if ($value["answer_id"]) {
                array_push($resultItem["answers"], [
                    "id" => $value["answer_id"],
                    "title" => $value["answer_title"],
                    "score" => $value["answer_score"],
                    "isRight" => $value["answer_isRight"] === 1,
                ]);
            }
            array_push($result, $resultItem);
        }

        $result = array_reduce($result, function ($carry, $item) {
            $resultItem = array_filter($carry, function ($obj) use ($item) {
                return $obj["id"] == $item["id"];
            });
            if (!$resultItem) {
                return [...$carry, [
                    "id" => $item["id"],
                    "title" => $item["title"],
                    "test_id" => $item["test_id"],
                    "answers" => $item["answers"]
                ]];
            }

            $updatedItem = reset($resultItem);
            $resultIdx = array_search($updatedItem, $carry);
            $updatedItem["answers"] = [...$updatedItem["answers"], ...$item["answers"]];
            $carry[$resultIdx] = $updatedItem;

            return $carry;
        }, []);

        return JSONResponse($result, 200);
    }

    function post()
    {
        if (!array_key_exists("test_id", array: $_GET) || !is_numeric($_GET["test_id"])) {
            return JSONResponse(["error" => "test_id isn't set"]);
        }

        $testId = $_GET["test_id"];
        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $questionTitle = $body->title;
        Question::validateTitle($questionTitle);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "INSERT INTO `questions` (`title`, `test_id`) VALUES (?, ?)");
        mysqli_stmt_bind_param($stmt, "sd", $questionTitle, $testId);
        mysqli_stmt_execute($stmt);

        $lastId = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($lastId);
    }

    function put()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Question not found"], 404);
        }

        $id = $_GET["id"];

        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $questionTitle = $body->title;
        Question::validateTitle($questionTitle);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "UPDATE `questions` SET `title` = ? WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "sd", $questionTitle, $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($id);
    }

    function delete()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Question not found"], 404);
        }

        $id = $_GET["id"];

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "DELETE FROM `questions` WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return JSONResponse(["result" => "success"], 200);
    }
}

$routeController = new TestQuestionsRouteController;
$routeController->init();
