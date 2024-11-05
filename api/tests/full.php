<?php

require_once '../controller.php';
require_once '../utils.php';
require_once '../db.php';
require_once '../models.php';

class TestsFullRouteController extends RouteController
{
    function getById($id)
    {
        if (!is_numeric($id)) {
            return JSONResponse(["error" => "Test not found"], 404);
        }

        $conn = openConnection();
        $stmt = mysqli_prepare($conn, "SELECT * FROM `tests` WHERE `id` = ?");
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
        $testQuestions = Test::validateQuestions($body->questions);

        $conn = openConnection();
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO `tests` (`title`, `desc`, `likes`) VALUES (?, ?, 0)");
            $stmt->bind_param("ss", $testTitle, $testDesc);
            $stmt->execute();

            $testId = $conn->insert_id;
            foreach ($testQuestions as $question) {
                $stmt = $conn->prepare("INSERT INTO `questions` (`title`, `test_id`) VALUES (?, ?)");
                $stmt->bind_param("sd", $question->title, $testId);
                $stmt->execute();

                $questionId = $conn->insert_id;
                foreach ($question->answers as $answer) {
                    $stmt = $conn->prepare("INSERT INTO `answers` (`title`, `score`, `isRight`, `question_id`) VALUES (?, COALESCE(?, DEFAULT(score)), COALESCE(?, DEFAULT(isRight)), ?)");
                    $stmt->bind_param("sddd", $answer->title, $answer->score, $answer->isRight, $questionId);
                    $stmt->execute();
                }
            }
            $conn->commit();
            return $this->getById($testId);
        } catch (\PDOException $e) {
            $conn->rollback();
            return JSONResponse(["error" => "Failed to create test with full data: " . $e->getMessage()], 500);
        }
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
        $testQuestions = Test::validateQuestions($body->questions);

        $conn = openConnection();
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE `tests` SET `title` = ?, `desc` = ? WHERE `id` = ?");
            $stmt->bind_param("ssd", $testTitle, $testDesc, $id);
            $stmt->execute();

            $stmt = $conn->prepare("DELETE FROM `questions` WHERE `test_id` = ?");
            $stmt->bind_param("d", $id);
            $stmt->execute();

            foreach ($testQuestions as $question) {
                $stmt = $conn->prepare("INSERT INTO `questions` (`title`, `test_id`) VALUES (?, ?)");
                $stmt->bind_param("sd", $question->title, $id);
                $stmt->execute();

                $questionId = $conn->insert_id;

                $stmt = $conn->prepare("DELETE FROM `answers` WHERE `question_id` = ?");
                $stmt->bind_param("d", $questionId);
                $stmt->execute();

                foreach ($question->answers as $answer) {
                    $stmt = $conn->prepare("INSERT INTO `answers` (`title`, `score`, `isRight`, `question_id`) VALUES (?, COALESCE(?, DEFAULT(score)), COALESCE(?, DEFAULT(isRight)), ?)");
                    $stmt->bind_param("sddd", $answer->title, $answer->score, $answer->isRight, $questionId);
                    $stmt->execute();
                }
            }
            $conn->commit();
            return $this->getById($id);
        } catch (\PDOException $e) {
            $conn->rollback();
            return JSONResponse(["error" => "Failed to update test with full data: " . $e->getMessage()], 500);
        }
    }
}

$routeController = new TestsFullRouteController;
$routeController->init();
