import React from "react";

const AIGuidelinesModal = ({
  aiGuidelines,
  aiGuidelinesForm,
  setAIGuidelinesForm,
  aiGuidelinesSaving,
  setShowAIGuidelinesModal,
  saveAIGuidelines,
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {aiGuidelines ? "Edit" : "Add"} AI Guidelines
        </h2>
        <button
          onClick={() => setShowAIGuidelinesModal(false)}
          className="text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAIGuidelines();
        }}
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Message</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={aiGuidelinesForm.message}
            onChange={(e) =>
              setAIGuidelinesForm((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
            rows={3}
            placeholder="Enter the AI guidelines message..."
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Prompt</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={aiGuidelinesForm.prompt}
            onChange={(e) =>
              setAIGuidelinesForm((prev) => ({
                ...prev,
                prompt: e.target.value,
              }))
            }
            rows={4}
            placeholder="Enter the AI prompt instructions..."
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">FAQs</label>
          <div className="space-y-2">
            {aiGuidelinesForm.FAQs.map((faq, idx) => (
              <div key={faq._id || idx} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={faq.question}
                  onChange={(e) => {
                    setAIGuidelinesForm((prev) => {
                      const newFAQs = prev.FAQs.map((f, i) =>
                        i === idx ? { ...f, question: e.target.value } : f
                      );
                      return { ...prev, FAQs: newFAQs };
                    });
                  }}
                  placeholder={`FAQ question #${idx + 1}`}
                />
                {aiGuidelinesForm.FAQs.length > 1 && (
                  <button
                    type="button"
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                    onClick={() => {
                      setAIGuidelinesForm((prev) => {
                        const newFAQs = prev.FAQs.filter((_, i) => i !== idx);
                        return { ...prev, FAQs: newFAQs };
                      });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            onClick={() => {
              setAIGuidelinesForm((prev) => ({
                ...prev,
                FAQs: [
                  ...prev.FAQs,
                  { question: "", _id: Math.random().toString(36).substr(2, 9) },
                ],
              }));
            }}
          >
            Add FAQ
          </button>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button
            type="button"
            onClick={() => setShowAIGuidelinesModal(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            disabled={aiGuidelinesSaving}
          >
            {aiGuidelinesSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Guidelines</span>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AIGuidelinesModal; 