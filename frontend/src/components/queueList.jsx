import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import QueueItems from "./queueItems";

const ManageQueue = ({ playingQueue, currentSongIndex }) => {
  return playingQueue.length > 1 ? (
    <div className="flex flex-grow w-full">
      <ScrollArea className="h-[250px] w-full mt-2 border rounded-lg  py-2 ">
        <SortableContext
          items={playingQueue}
          strategy={verticalListSortingStrategy}
        >
          {playingQueue.map((item, index) => {
            return index > currentSongIndex ? (
              <QueueItems id={item.id} key={item.id} title={item.title} />
            ) : null;
          })}
        </SortableContext>
      </ScrollArea>
    </div>
  ) : null;
};

export default ManageQueue;
