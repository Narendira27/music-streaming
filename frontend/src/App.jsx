import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Volume2,
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Plus,
  X,
} from "lucide-react";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState([30]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSong, setNewSong] = useState({ name: "", url: "" });

  const handleAddSong = () => {
    console.log("Adding song:", newSong);
    setNewSong({ name: "", url: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">Notify</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Songs
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Liked Songs */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Added Songs</h2>
        <div className="rounded-md border border-border  overflow-hidden flex flex-col">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...songs, ...songs, ...songs].map((song, index) => (
                  <TableRow
                    key={`${song.id}-${index}`}
                    className="hover:bg-muted/50"
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                      ></Button>
                    </TableCell>
                    <TableCell className="font-medium">{song.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {song.artist}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {song.album}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {song.duration}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Remove </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Song Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center text-foreground">
              Add New Song
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Song Name
              </label>
              <Input
                id="name"
                value={newSong.name}
                onChange={(e) =>
                  setNewSong({ ...newSong, name: e.target.value })
                }
                placeholder="Enter song name"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="url"
                className="text-sm font-medium text-foreground"
              >
                YouTube URL
              </label>
              <Input
                id="url"
                value={newSong.url}
                onChange={(e) =>
                  setNewSong({ ...newSong, url: e.target.value })
                }
                placeholder="Enter YouTube URL"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAddSong}>Add Song</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Player */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center space-x-4 min-w-[180px]">
              <div className="w-12 h-12 bg-muted rounded-md" />
              <div>
                <div className="font-medium">Current Song</div>
                <div className="text-sm text-muted-foreground">Artist Name</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1 px-4 max-w-2xl">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <PauseCircle className="h-8 w-8" />
                  ) : (
                    <PlayCircle className="h-8 w-8" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Repeat className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm text-muted-foreground w-12 text-right">
                  1:23
                </span>
                <Slider
                  value={progress}
                  onValueChange={setProgress}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground w-12">3:45</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 min-w-[140px] justify-end">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const songs = [
  {
    id: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
  },
  {
    id: 2,
    title: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:35",
  },
  {
    id: 3,
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
  },
  {
    id: 4,
    title: "Die For You",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "4:20",
  },
  {
    id: 5,
    title: "Out of Time",
    artist: "The Weeknd",
    album: "Dawn FM",
    duration: "3:34",
  },
  {
    id: 6,
    title: "Less Than Zero",
    artist: "The Weeknd",
    album: "Dawn FM",
    duration: "3:31",
  },
  {
    id: 7,
    title: "Sacrifice",
    artist: "The Weeknd",
    album: "Dawn FM",
    duration: "3:08",
  },
  {
    id: 8,
    title: "Take My Breath",
    artist: "The Weeknd",
    album: "Dawn FM",
    duration: "3:45",
  },
];
