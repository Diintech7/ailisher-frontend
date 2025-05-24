import SummaryTab from "./tabs/SummaryTab.jsx"
import ObjectiveTab from "./tabs/ObjectiveTab.jsx"
import SubjectiveTab from "./tabs/SubjectiveTab.jsx"
import VideosTab from "./tabs/VideosTab.jsx"
import PyqsTab from "./tabs/PyqsTab.jsx"

const TabContent = ({
  activeTab,
  summaries,
  videos,
  pyqs,
  objectiveQuestionSets,
  subjectiveQuestionSets,
  activeObjectiveLevelTab,
  setActiveObjectiveLevelTab,
  activeLevelTab,
  setActiveLevelTab,
  selectedObjectiveSet,
  setSelectedObjectiveSet,
  selectedSubjectiveSet,
  setSelectedViewSet,
  itemType,
  getCurrentItemId,
  isWorkbook,
}) => {
  switch (activeTab) {
    case "summary":
      return <SummaryTab summaries={summaries} />
    case "objective":
      return (
        <ObjectiveTab
          objectiveQuestionSets={objectiveQuestionSets}
          activeObjectiveLevelTab={activeObjectiveLevelTab}
          setActiveObjectiveLevelTab={setActiveObjectiveLevelTab}
          selectedObjectiveSet={selectedObjectiveSet}
          setSelectedObjectiveSet={setSelectedObjectiveSet}
        />
      )
    case "subjective":
      return (
        <SubjectiveTab
          subjectiveQuestionSets={subjectiveQuestionSets}
          activeLevelTab={activeLevelTab}
          setActiveLevelTab={setActiveLevelTab}
          selectedSubjectiveSet={selectedSubjectiveSet}
          setSelectedViewSet={setSelectedViewSet}
        />
      )
    case "videos":
      return <VideosTab videos={videos} />
    case "pyqs":
      return <PyqsTab pyqs={pyqs} />
    default:
      return null
  }
}

export default TabContent
