<?php

class Test
{
    static $maxTitleLength = 128;
    static $maxDescLength = 512;

    static function validateTitle($title)
    {
        if (!$title) {
            return JSONResponse(["error" => "The test title can't be shorter than 1 character"]);
        }

        $maxLength = Test::$maxTitleLength;
        if (strlen($title) > $maxLength) {
            return JSONResponse(["error" => "The test title can't be longer than {$maxLength} characters"]);
        }

        return $title;
    }

    static function validateDesc($desc)
    {
        if (!$desc || $desc === "") {
            return null;
        }

        $maxLength = Test::$maxDescLength;
        if (strlen($desc) > $maxLength) {
            return JSONResponse(["error" => "The test desc can't be longer than {$maxLength} characters"]);
        }

        return $desc;
    }

    static function validateQuestions($questions)
    {
        if (!$questions) {
            return [];
        }

        if (!is_array($questions)) {
            return JSONResponse(["error" => "Invalid questions format"]);
        }

        return array_map(function ($question) {
            Question::validateTitle($question->title);
            $question->answers = Question::validateAnswers($question->answers);
            return $question;
        }, $questions);
    }
}

class Question
{
    static $maxTitleLength = 256;

    static function validateTitle($title)
    {
        if (!$title) {
            return JSONResponse(["error" => "The question title can't be shorter than 1 character"]);
        }

        $maxLength = Question::$maxTitleLength;
        if (strlen($title) > $maxLength) {
            return JSONResponse(["error" => "The question title can't be longer than {$maxLength} characters"]);
        }

        return $title;
    }

    static function validateAnswers($answers)
    {
        if (!$answers) {
            return [];
        }

        if (!is_array($answers)) {
            return JSONResponse(["error" => "Invalid answers format"]);
        }

        return array_map(function ($answer) {
            Answer::validateTitle($answer->title);
            Answer::validateScore($answer->score);
            Answer::validateIsRight($answer->isRight);
            return $answer;
        }, $answers);
    }
}

class Answer
{
    static $maxTitleLength = 256;
    static $maxScore = 10;
    static $minScore = 0;

    static function validateTitle($title)
    {
        if (!$title) {
            return JSONResponse(["error" => "The answer title can't be shorter than 1 character"]);
        }

        $maxLength = Question::$maxTitleLength;
        if (strlen($title) > $maxLength) {
            return JSONResponse(["error" => "The answer title can't be longer than {$maxLength} characters"]);
        }

        return $title;
    }

    static function validateScore($score)
    {
        if ($score && !is_numeric($score)) {
            return JSONResponse(["error" => "The answer score must be valid integer"]);
        }

        $minScore = Answer::$minScore;
        $maxScore = Answer::$maxScore;
        if ($score && ($score < $minScore || $score > $maxScore)) {
            return JSONResponse(["error" => "The answer score must be between {$minScore} and {$maxScore}"]);
        }

        return $score;
    }

    static function validateIsRight($isRight)
    {
        if ($isRight && !is_bool($isRight)) {
            return JSONResponse(["error" => "The answer isRight must be valid boolean value"]);
        }

        return $isRight;
    }
}
