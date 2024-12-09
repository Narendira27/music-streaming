import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";

const QueueItems = ({ id, title }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const Style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  return (
    <div
      className="py-2 cursor-default hover:bg-blue-400 hover:text-black rounded-xl px-4"
      ref={setNodeRef}
      style={Style}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between space-x-4">
        <h1>{title}</h1>
      </div>
    </div>
  );
};

export default QueueItems;
