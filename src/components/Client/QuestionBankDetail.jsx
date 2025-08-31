import React from "react";
import { useParams } from "react-router-dom";
import QuestionBankObjective from "./QuestionBankObjective";
import QuestionBankSubjective from "./QuestionBankSubjective";

export default function QuestionBankDetail() {
  const { type } = useParams();
  if (type === "Objective") {
    return <QuestionBankObjective/>;
  }
  return <QuestionBankSubjective />;
}


