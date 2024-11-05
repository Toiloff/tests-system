<?php

require_once '../../controller.php';
require_once '../../utils.php';
require_once '../../db.php';
require_once '../../models.php';

class QuestionAnswersRouteController extends RouteController
{
    function get()
    {
        if (array_key_exists("id", array: $_GET)) {
            return $this->getById($_GET["id"]);
        }

        if (array_key_exists("question_id", array: $_GET)) {
            return $this->getByQuestionId($_GET["question_id"]);
        }

        return $this->getAll();
    }

    function getAll()
    {
        $conn = openConnection();
        $result = mysqli_query($conn, "SELECT * FROM `answers`");
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_close($conn);
        $result = array_map(function ($item) {
            $item["isRight"] = $item["isRight"] === 1;
            return $item;
        }, $data);

        return JSONResponse($result, 200);
    }

    function getById($id)
    {
        if (!is_numeric($id)) {
            return JSONResponse(["error" => "Answer not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT * FROM `answers` WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);
        if (!$data) {
            return JSONResponse(["error" => "Answer not found"], 404);
        }

        $result = $data[0];
        $result["isRight"] = $result["isRight"] === 1;

        return JSONResponse($result, 200);
    }

    function getByQuestionId($questionId)
    {
        if (!is_numeric($questionId)) {
            return JSONResponse(["error" => "Answers not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT * FROM `answers` WHERE `question_id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $questionId);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);
        if (!$data) {
            return JSONResponse(["error" => "Answers not found"], 404);
        }

        $result = array_map(function ($item) {
            $item["isRight"] = $item["isRight"] === 1;
            return $item;
        }, $data);

        return JSONResponse($result, 200);
    }

    function post()
    {
        if (!array_key_exists("question_id", array: $_GET) || !is_numeric($_GET["question_id"])) {
            return JSONResponse(["error" => "question_id isn't set"]);
        }

        $questionId = $_GET["question_id"];
        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $answerTitle = $body->title;
        $answerScore = $body->score;
        $answerIsRight = $body->isRight;
        Answer::validateTitle($answerTitle);
        Answer::validateScore($answerScore);
        Answer::validateIsRight($answerIsRight);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "INSERT INTO `answers` (`title`, `score`, `isRight`, `question_id`) VALUES (?, COALESCE(?, DEFAULT(score)), COALESCE(?, DEFAULT(isRight)), ?)");
        mysqli_stmt_bind_param($stmt, "sddd", $answerTitle, $answerScore, $answerIsRight, $questionId);
        mysqli_stmt_execute($stmt);

        $lastId = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($lastId);
    }

    function put()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Answer not found"], 404);
        }

        $id = $_GET["id"];

        $body = $this->getJSONBody();
        $requiredKeys = ["title"];
        validateBody($body, $requiredKeys);
        $answerTitle = $body->title;
        $answerScore = $body->score;
        $answerIsRight = $body->isRight;
        Answer::validateTitle($answerTitle);
        Answer::validateScore($answerScore);
        Answer::validateIsRight($answerIsRight);

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "UPDATE `answers` SET `title` = ?, `score` = COALESCE(?, DEFAULT(score)), `isRight` = COALESCE(?, DEFAULT(isRight)) WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "sddd", $answerTitle, $answerScore, $answerIsRight, $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return $this->getById($id);
    }

    function delete()
    {
        if (!array_key_exists("id", array: $_GET) || !is_numeric($_GET["id"])) {
            return JSONResponse(["error" => "Answer not found"], 404);
        }

        $id = $_GET["id"];

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "DELETE FROM `answers` WHERE `id` = ?");
        mysqli_stmt_bind_param($stmt, "d", $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
        mysqli_close($conn);

        return JSONResponse(["result" => "success"], 200);
    }
}

$routeController = new QuestionAnswersRouteController;
$routeController->init();
