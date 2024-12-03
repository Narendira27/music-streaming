import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

import axios from "axios";
import Cookies from "js-cookie";

import { toast } from "sonner";
import { API_URL } from "@/lib/url";
import { useNavigate } from "react-router-dom";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleStatus, setShuffleStatus] = useState(false);
  const [playingQueue, setPlayingQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [repeatStatus, setRepeatStatus] = useState(false);
  const repeatStatusRef = useRef(repeatStatus);

  const [volume, setVolume] = useState([100]);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogOpenUpdate, setIsDialogOpenUpdate] = useState(false);
  const [isDialogOpenDelete, setIsDialogOpenDelete] = useState(false);
  const [newSong, setNewSong] = useState({ name: "", url: "" });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateDetails, setUpdateDetails] = useState({ name: "", url: "" });
  const [deleteDetails, setDeleteDetails] = useState("");

  const [audio, setAudio] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    repeatStatusRef.current = repeatStatus;
  }, [repeatStatus]);

  const fetchSongs = () => {
    const authToken = Cookies.get("auth-cookie");
    const fetchSongs = axios.get(API_URL + "/user/song", {
      headers: { Authorization: "Bearer " + authToken },
    });
    toast.promise(fetchSongs, {
      loading: "Fetching your Songs .... ",
      success: (res) => {
        const UpdateArr = res.data.data.map((each) => ({
          ...each,
          isPlaying: false,
        }));
        setSongs(UpdateArr);
        setLoading(false);
        return `Your Songs has been loaded`;
      },
      error: (res) => {
        if (res.response.data.msg === "JWT expired or invalid") {
          navigate("/");
          Cookies.remove("auth-cookie");
        }
        setLoading(false);
        return `Error : ${res.response.data.msg}`;
      },
    });
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    const authToken = Cookies.get("auth-cookie");
    if (audio !== null) audio.src = "";

    if (playingQueue.length === 0) {
      setIsPlaying(false);
      return;
    }

    if (playingQueue.length - 1 < currentSongIndex) {
      setIsPlaying(false);
      setCurrentSongIndex(0);
      setPlayingQueue([]);
      setProgress([0]);
      return;
    }

    const fetchAndPlaySong = async () => {
      const currentSong = playingQueue[currentSongIndex];
      const authToken = Cookies.get("auth-cookie");

      try {
        const response = await axios.get(
          `${API_URL}/stream/song?id=${currentSong.fileName}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            responseType: "blob",
          }
        );

        const url = URL.createObjectURL(response.data);
        const newAudio = new Audio(url);

        setAudio(newAudio);

        newAudio.onloadedmetadata = () => {
          setDuration(newAudio.duration);
        };

        newAudio.ontimeupdate = () => {
          setCurrentTime(newAudio.currentTime);
          if (newAudio.duration > 0) {
            setProgress([(newAudio.currentTime / newAudio.duration) * 100]);
          }
        };
        newAudio.play();
        const getPlayingId = playingQueue[currentSongIndex].id;
        const updateSongsList = songs.map((each) => {
          if (each.id === getPlayingId) {
            return { ...each, isPlaying: true };
          }
          return { ...each, isPlaying: false };
        });
        setSongs(updateSongsList);
        toast.success("Playing: " + currentSong.title, {
          position: "top-left",
        });

        newAudio.onended = () => {
          if (repeatStatusRef.current) {
            newAudio.currentTime = 0;
            newAudio.play();
            setRepeatStatus(false);
          } else {
            const updatePlayingIndex = currentSongIndex + 1;
            setCurrentSongIndex(updatePlayingIndex);
            if (playingQueue.length > 0) {
              let getPlayingId = playingQueue[currentSongIndex];
              const updateSongsList = songs.map((each) => {
                if (each.id === getPlayingId) {
                  return { ...each, isPlaying: true };
                }
                return { ...each, isPlaying: false };
              });
              setSongs(updateSongsList);
            } else {
              setSongs((each) => ({ ...each, isPlaying: false }));
            }
          }
        };
      } catch (error) {
        toast.error(
          `Error: ${error.response?.data?.msg || "Something went wrong"}`,
          { id: toastId }
        );
      }
    };

    fetchAndPlaySong();

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [playingQueue, currentSongIndex]);

  const handleVolumeChange = (value) => {
    setVolume(value);
    audio.volume = normalizeVolume(volume[0]);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      toast.info("Pause");
    } else {
      audio.play();
      setIsPlaying(true);
      toast.info("Playing");
    }
  };

  const handleAddSong = async () => {
    if (newSong.name.length > 2 && newSong.url) {
      const authToken = Cookies.get("auth-cookie");
      const responseAddSong = axios.post(
        API_URL + "/user/song",
        {
          title: newSong.name,
          youtubeUrl: newSong.url,
        },
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        }
      );
      toast.promise(responseAddSong, {
        loading: "AddingSong... This might take some time",
        success: () => {
          fetchSongs();
          return `Song has been added`;
        },
        error: (res) => {
          return `Error : ${res.response.data.msg}`;
        },
      });
      setNewSong({ name: "", url: "" });
      setIsDialogOpen(false);
    }
  };

  function convertSecToMinSec(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = parseInt(seconds % 60);

    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds =
      remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  const onClickPlaySong = (data) => {
    const updateArr = songs.map((each) => {
      if (each.id === data.id) {
        return { ...each, isPlaying: true };
      }
      return { ...each, isPlaying: false };
    });
    setSongs(updateArr);
    setIsPlaying(true);
    setPlayingQueue((prev) => [data, ...prev]);
  };

  const handleProgressBar = (value) => {
    const newTime = (value / 100) * duration;
    setProgress([value]);
    audio.currentTime = newTime;
  };

  const normalizeVolume = (volume) => Math.max(0, Math.min(1, volume / 100));

  const handleShuffle = () => {
    if (isPlaying === false) {
      setShuffleStatus((prev) => !prev);
      if (shuffleStatus) {
        toast.info("Shuffle Disabled");
      } else {
        toast.info("Shuffle Enabled");
      }
    }
  };

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const handlePlayListPlay = () => {
    if (shuffleStatus) {
      const duplicateSong = [...songs];
      const shuffledArray = shuffle(duplicateSong);
      setPlayingQueue(shuffledArray);
      setIsPlaying(true);
      toast.info("Playing Added Songs | Shuffle Enabled");
    } else {
      setPlayingQueue(songs);
      setIsPlaying(true);
      toast.info("Playing Added Songs | Shuffle Disabled");
    }
  };

  const handleReShuffle = () => {
    const duplicateSong = [...songs];
    const shuffledArray = shuffle(duplicateSong);
    setPlayingQueue(shuffledArray);
    setIsPlaying(true);
    toast.info("Shuffled, Playing Now ....");
  };

  const handleRepeat = () => {
    setRepeatStatus((prev) => !prev);
    if (repeatStatus) {
      toast.info("Repeat Disabled");
    } else {
      toast.info("Repeat Enabled");
    }
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentSongIndex((prev) => prev - 1);
  };

  const handleLogout = () => {
    Cookies.remove("auth-cookie");
    navigate("/");
    toast.info("You're successfully logged out!");
  };

  const onClickUpdate = (details) => {
    setUpdateDetails({
      name: details.title,
      url: details.youtubeUrl,
      id: details.id,
    });
    setIsDialogOpenUpdate(true);
  };
  const onClickDelete = (details) => {
    setDeleteDetails(details.id);
    setIsDialogOpenDelete(true);
  };

  const handleUpdateSong = () => {
    if (updateDetails.name.length > 2 && updateDetails.url) {
      const authToken = Cookies.get("auth-cookie");
      const responseAddSong = axios.put(
        API_URL + "/user/song?id=" + updateDetails.id,
        {
          title: updateDetails.name,
          youtubeUrl: updateDetails.url,
        },
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        }
      );
      toast.promise(responseAddSong, {
        loading: "Updating... This might take some time",
        success: () => {
          fetchSongs();
          return `Song has been Updated`;
        },
        error: (res) => {
          return `Error : ${res.response.data.msg}`;
        },
      });
      setUpdateDetails({ name: "", url: "" });
      setIsDialogOpenUpdate(false);
    }
  };
  const handleDeleteSong = () => {
    const authToken = Cookies.get("auth-cookie");
    const responseAddSong = axios.delete(
      API_URL + "/user/song?id=" + deleteDetails,
      {
        headers: {
          Authorization: "Bearer " + authToken,
        },
      }
    );
    toast.promise(responseAddSong, {
      loading: "Deleting...",
      success: () => {
        fetchSongs();
        return `Song has been Deleted`;
      },
      error: (res) => {
        return `Error : ${res.response.data.msg}`;
      },
    });
    setDeleteDetails("");
    setIsDialogOpenDelete(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
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
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>

      {/* Main Content - Liked Songs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 pt-2 pb-6">
          <h2 className="text-2xl font-bold ">Your Songs</h2>
          <div className="flex h-full items-center">
            <button
              onClick={handleShuffle}
              className={`mx-2 rounded-full  flex justify-center p-0.5 w-10 ${
                shuffleStatus === true
                  ? " dark:text-black dark:bg-white  text-white  bg-black"
                  : " dark:text-white text-black "
              } `}
            >
              <Shuffle className="h-8 w-6" />
            </button>

            {isPlaying === true ? (
              <PauseCircle className="cursor-pointer h-8 w-10" />
            ) : (
              <PlayCircle
                onClick={handlePlayListPlay}
                className="cursor-pointer h-8 w-10"
              />
            )}
          </div>
        </div>

        {songs.length > 0 && loading === false ? (
          <div className="flex-1 overflow-auto px-4">
            <div className="rounded-md border border-border  ">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>

                      <TableHead>Title</TableHead>
                      {document.documentElement.clientWidth > 1024 ? (
                        <TableHead>
                          <div>Youtube URL</div>
                        </TableHead>
                      ) : null}

                      <TableHead>Duration</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...songs].map((song, index) => {
                      return (
                        <TableRow key={song.id} className="hover:bg-muted/50">
                          <TableCell className="cursor-pointer px-2 lg:px-8">
                            {song.isPlaying === true ? (
                              <PauseCircle
                                onClick={() => handlePlayPause()}
                                className="h-6 w-6"
                              />
                            ) : (
                              <PlayCircle
                                onClick={() => onClickPlaySong(song)}
                                className="h-6 w-6"
                              />
                            )}
                          </TableCell>

                          <TableCell className="font-medium">
                            {song.title}
                          </TableCell>
                          {document.documentElement.clientWidth > 1024 ? (
                            <TableCell className="text-muted-foreground">
                              {song.youtubeUrl}
                            </TableCell>
                          ) : null}
                          <TableCell className="text-muted-foreground">
                            {convertSecToMinSec(parseFloat(song.duration))}
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
                                <DropdownMenuItem
                                  onClick={() => onClickUpdate(song)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onClickDelete(song)}
                                >
                                  Remove{" "}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center ">
            <h1>No songs to show. Please add some songs</h1>
          </div>
        )}
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
            <Button onClick={handleAddSong}>Add Song</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpenUpdate} onOpenChange={setIsDialogOpenUpdate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center text-foreground">
              Update
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
                value={updateDetails.name}
                onChange={(e) =>
                  setUpdateDetails((each) => ({
                    ...each,
                    name: e.target.value,
                  }))
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
                value={updateDetails.url}
                onChange={(e) =>
                  setUpdateDetails((each) => ({
                    ...each,
                    url: e.target.value,
                  }))
                }
                placeholder="Enter YouTube URL"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button onClick={handleUpdateSong}>Update Song </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpenDelete} onOpenChange={setIsDialogOpenDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center text-foreground">
              Are You sure ? This cannot be undone.
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpenDelete(false)}
            >
              Close
            </Button>
            <Button onClick={handleDeleteSong}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Player */}
      <div className=" border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 flex flex-col  gap-4">
          <div className="flex items-center gap-4 justify-center max-w-7xl mx-auto w-full">
            <div className="flex flex-col  items-center gap-2 flex-1 px-4 max-w-2xl">
              <div className="text-lg font-medium">
                {playingQueue.length === 0 ||
                playingQueue.length - 1 < currentSongIndex
                  ? "Play a Song"
                  : playingQueue[currentSongIndex].title}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleReShuffle}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button
                  disabled={currentSongIndex === 0}
                  onClick={handlePrev}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <PauseCircle className="h-8 w-8" />
                  ) : (
                    <PlayCircle className="h-8 w-8" />
                  )}
                </Button>
                <Button
                  disabled={
                    currentSongIndex === playingQueue.length - 1 ||
                    playingQueue.length === 0
                  }
                  onClick={handleNext}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleRepeat}
                  variant="ghost"
                  size="icon"
                  className={
                    repeatStatus === true
                      ? "dark:bg-white dark:text-black bg-black text-white h-8 w-8"
                      : "h-8 w-8"
                  }
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {convertSecToMinSec(currentTime)}
                </span>
                <Slider
                  value={progress}
                  onValueChange={(value) => handleProgressBar(value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground w-12">
                  {convertSecToMinSec(duration)}
                </span>
              </div>
            </div>
            <div className=" hidden lg:flex items-center space-x-2 min-w-[140px] justify-end">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Slider
                value={volume}
                onValueChange={(value) => handleVolumeChange(value)}
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
