import React from "react";
import { useParams } from "react-router-dom";
import SubjectiveTestDetail from "./SubjectiveTestDetail";
import ObjectiveTestDetail from "./ObjectiveTestDetail";

export default function TestDetail() {
  const { type } = useParams();
  if (type === "objective" || type === "Objective") {
    return <ObjectiveTestDetail />;
  }
  return <SubjectiveTestDetail />;
}


