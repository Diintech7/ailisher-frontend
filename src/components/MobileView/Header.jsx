import { Book, FileText, List, BookOpen } from "lucide-react"
import { getCompleteImageUrl } from "./utilss/api.jsx"

const Header = ({ item, itemType, imageError, setImageError }) => {
  return (
    <div className="mb-4 md:mb-6">
      <div className={itemType === "book" ? "md:flex md:items-start" : ""}>
        <div className={itemType === "book" ? "md:w-1/4 lg:w-1/5 mb-4 md:mb-0 md:mr-6" : "hidden"}>
          {itemType === "book" && item?.coverImage && !imageError && (
            <img
              src={getCompleteImageUrl(item.coverImage) || "/placeholder.svg"}
              alt={item?.title}
              className="w-full rounded-lg shadow-md border-4 border-white"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className={itemType === "book" ? "md:w-3/4 lg:w-4/5" : "w-full"}>
          <div className="mb-4">
            <div className="flex flex-col items-start">
              <div className="mb-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center shadow-md">
                {itemType === "book" ? (
                  <>
                    <Book size={18} className="mr-2" /> Book Assets
                  </>
                ) : itemType === "chapter" ? (
                  <>
                    <FileText size={18} className="mr-2" /> Chapter Assets
                  </>
                ) : itemType === "topic" ? (
                  <>
                    <List size={18} className="mr-2" /> Topic Assets
                  </>
                ) : (
                  <>
                    <BookOpen size={18} className="mr-2" /> Sub-Topic Assets
                  </>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700">
                  {item?.title}
                </h1>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-700 mt-2 bg-white bg-opacity-70 p-3 rounded-lg shadow-sm">
              {item?.description || "No description available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
