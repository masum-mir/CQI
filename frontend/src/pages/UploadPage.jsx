import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FilePreviewPanel } from "@/components/uploads/FilePreviewPanel";
import { courseApi } from "@/api/courseApi";
import { itemApi } from "@/api/itemApi";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES } from "@/utils/uploadConstants";
import useCourseUpload from "@/hooks/useCourseUpload";
import ViewModeToggle from "@/components/uploads/ViewModeToggle";
import UploadToolbar from "@/components/uploads/UploadToolbar";
import BottomBar from "@/components/uploads/BottomBar";
import GroupedUploadView from "@/components/uploads/GroupedUploadView";
import FolderUploadView from "@/components/uploads/FolderUploadView";
import ListUploadView from "@/components/uploads/ListUploadView";

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const targetItemIdRef = useRef(null);

  const { user } = useAuth();
  const [viewMode, setViewMode] = useState("grouped");
  const [selectedItem, setSelectedItem] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loadingShell, setLoadingShell] = useState(true);
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [semesterMenuOpen, setSemesterMenuOpen] = useState(false);

  const {
    courseFiles,
    committing,
    totalItems,
    totalFiles,
    queuedCount,
    getFileForItem,
    handleFileAdd,
    handleRemoveFile,
    handleCommit,
  } = useCourseUpload(activeCourseId);

  useEffect(() => {
    Promise.all([itemApi.list(), courseApi.list()])
      .then(([iRes, cRes]) => {
        const all = cRes.data.data.courses || [];
        const mine = all.filter(
          (c) =>
            c.facultyCode &&
            user?.shortCode &&
            c.facultyCode.trim().toLowerCase() === user.shortCode.trim().toLowerCase()
        );
        setAllCourses(mine);
        const sems = [...new Set(mine.map((c) => c.semester).filter(Boolean))].sort((a, b) =>
          b.localeCompare(a)
        );
        if (sems.length) {
          setActiveSemester(sems[0]);
          const first = mine.find((c) => c.semester === sems[0]);
          if (first) setActiveCourseId(first.id);
        }
      })
      .catch(() => toast.error("Failed to load courses or required items"))
      .finally(() => setLoadingShell(false));
  }, [user?.shortCode, user?.role]);

  useEffect(() => {
    setSelectedItem(null);
  }, [activeCourseId]);

  const semesters = useMemo(
    () =>
      [...new Set(allCourses.map((c) => c.semester).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [allCourses]
  );

  const visibleCourses = useMemo(
    () => allCourses.filter((c) => !activeSemester || c.semester === activeSemester),
    [allCourses, activeSemester]
  );

  const handleSemesterSelect = (sem) => {
    setActiveSemester(sem);
    setSemesterMenuOpen(false);
    const first = allCourses.find((c) => c.semester === sem);
    setActiveCourseId(first ? first.id : null);
  };

  const onSlotClick = (itemId) => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }
    const existing = getFileForItem(itemId);
    if (existing) {
      setSelectedItem(existing);
    } else {
      targetItemIdRef.current = itemId;
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full h-full flex flex-col px-4 py-8">
      <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex">
        <div className="flex-1 flex flex-col min-w-0">
          <UploadToolbar
            loadingShell={loadingShell}
            visibleCourses={visibleCourses}
            activeCourseId={activeCourseId}
            onCourseSelect={setActiveCourseId}
            semesters={semesters}
            activeSemester={activeSemester}
            onSemesterSelect={handleSemesterSelect}
            semesterMenuOpen={semesterMenuOpen}
            onToggleSemesterMenu={() => setSemesterMenuOpen((o) => !o)}
            onCloseSemesterMenu={() => setSemesterMenuOpen(false)}
            courseFiles={courseFiles}
          />

          <div className="flex-1 min-h-0 flex overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-end mb-4">
                  <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
                </div>

                {viewMode === "grouped" && (
                  <GroupedUploadView
                    categories={CATEGORIES}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                    onRemoveFile={(id) => handleRemoveFile(id, selectedItem, setSelectedItem)}
                  />
                )}
                {viewMode === "folder" && (
                  <FolderUploadView
                    categories={CATEGORIES}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                    onRemoveFile={(id) => handleRemoveFile(id, selectedItem, setSelectedItem)}
                  />
                )}
                {viewMode === "list" && (
                  <ListUploadView
                    categories={CATEGORIES}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                  />
                )}
              </div>
            </div>
          </div>

          <BottomBar
            totalFiles={totalFiles}
            totalItems={totalItems}
            queuedCount={queuedCount}
            committing={committing}
            onCommit={handleCommit}
            onBack={() => navigate(-1)}
          />
        </div>
      </div>

      <FilePreviewPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onRemove={() => {
          if (selectedItem) handleRemoveFile(selectedItem.fileType, selectedItem, setSelectedItem);
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={(e) => handleFileAdd(e, targetItemIdRef, selectedItem, setSelectedItem)}
      />
    </div>
  );
}
