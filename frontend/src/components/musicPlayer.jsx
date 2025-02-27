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
  ListMusic,
  Search,
  AlignJustify,
  CircleX,
  Moon,
} from "lucide-react";

import axios from "axios";
import Cookies from "js-cookie";

import { toast } from "sonner";
import { API_URL } from "@/lib/url";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import ManageQueue from "@/components/queueList";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  const [playingQueue, setPlayingQueue] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState({});

  const [shuffleStatus, setShuffleStatus] = useState(false);

  const [volume, setVolume] = useState([100]);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogPreference, setDialogPreference] = useState(true);
  const [addSongTab, setAddSongTab] = useState("search");
  const [isDialogOpenUpdate, setIsDialogOpenUpdate] = useState(false);
  const [isDialogOpenDelete, setIsDialogOpenDelete] = useState(false);
  const [isRepeatDialogOpen, setIsRepeatDialogOpen] = useState(false);
  const [isSleepTimerDialogOpen, setIsSleepTimerDialogOpen] = useState(false);

  const [newSong, setNewSong] = useState({ name: "", url: "" });
  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updateDetails, setUpdateDetails] = useState({ name: "", url: "" });
  const [deleteDetails, setDeleteDetails] = useState("");

  // repeat status
  const [repeatStatus, setRepeatStatus] = useState({
    status: false,
    times: 0,
    custom: false,
    value: "default",
  });
  const repeatStatusRef = useRef(repeatStatus);

  //  sleep timer
  const [sleepTimerInfo, setSleepTimerInfo] = useState({
    status: false,
    sleepTime: 0,
    custom: false,
    value: "default",
  });

  const [sleepTimerId, setSleepTimerId] = useState("");

  // user search query
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // show user songs
  const [userResultSongs, setUserResultSongs] = useState([]);

  // show hide search in mobile view
  const [showSearchMobile, setShowSearchMobile] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  const [enableAdminButton, setEnableAdminButton] = useState(false);

  const [audio] = useState(new Audio());

  const navigate = useNavigate();

  useEffect(() => {
    const authToken = Cookies.get("auth-cookie");
    axios
      .get(API_URL + "/admin/me", {
        headers: { Authorization: "Bearer " + authToken },
      })
      .then(() => {
        setEnableAdminButton(true);
      });
  }, []);

  useEffect(() => {
    const authToken = Cookies.get("auth-cookie");
    const fetchResults = async () => {
      const fetchSongs = await axios.get(
        API_URL + "/user/search-song/?name=" + searchQuery,
        {
          headers: { Authorization: "Bearer " + authToken },
        }
      );
      setSearchSuggestions(fetchSongs.data);
    };

    if (searchQuery.length > 2) {
      fetchResults();
    }
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

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
        setUserResultSongs(UpdateArr);
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
    setCurrentSong({ ...playingQueue[currentSongIndex] });
  }, [currentSongIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        if (
          document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying]);

  useEffect(() => {
    if ("mediaSession" in navigator && currentSong !== undefined) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
      });

      navigator.mediaSession.setActionHandler("play", togglePlay);
      navigator.mediaSession.setActionHandler("pause", togglePause);
      navigator.mediaSession.setActionHandler("previoustrack", handlePrev);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
    }
  }, [currentSongIndex, currentSong]);

  useEffect(() => {
    repeatStatusRef.current = repeatStatus; // Keep ref updated with the latest state
  }, [repeatStatus]);

  //  handles the  playing songs
  useEffect(() => {
    if (audio !== null) audio.src = "";

    if (playingQueue.length === 0) {
      setIsPlaying(false);
      return;
    }

    if (playingQueue.length - 1 < currentSongIndex) {
      setIsPlaying(false);
      setCurrentSongIndex("");
      setPlayingQueue([]);
      setProgress([0]);
      return;
    }

    const fetchAndPlaySong = async () => {
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

        audio.src = url;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          if (audio.duration > 0) {
            setProgress([(audio.currentTime / audio.duration) * 100]);
          }
        };

        audio.play();
        setIsPlaying(true);

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

        audio.onended = () => {
          const currentRepeatStatus = repeatStatusRef.current;
          if (currentRepeatStatus.times > 0) {
            setRepeatStatus((prev) => {
              if (prev.times > 1) {
                toast.info(
                  `Repeating song, remaining: ${prev.times - 1} times`
                );
                return { ...prev, times: prev.times - 1 };
              } else {
                toast.info("Last repeat, moving to next song");
                return { ...prev, status: false, times: 0, custom: false };
              }
            });
            audio.currentTime = 0;
            audio.play();
          } else {
            const updatePlayingIndex = currentSongIndex + 1;
            setCurrentSongIndex(updatePlayingIndex);
            if (playingQueue.length > 0) {
              let getPlayingId = currentSong;
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
        console.log(error);
        toast.error(
          `Error: ${error.response?.data?.msg || "Something went wrong"}`
        );
      }
    };

    if (currentSong.fileName !== undefined) {
      fetchAndPlaySong();
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [currentSong]);

  //  volume control
  const handleVolumeChange = (value) => {
    setVolume(value);
    audio.volume = normalizeVolume(volume[0]);
  };

  //  play and pause
  const handlePlayPause = () => {
    if (playingQueue.length > 0) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        toast.info("Pause");
      } else {
        audio.play();
        setIsPlaying(true);
        toast.info("Playing");
      }
    }
  };

  const togglePause = () => {
    audio.pause();
    setIsPlaying(false);
    toast.info("Pause");
  };

  const togglePlay = () => {
    audio.play();
    setIsPlaying(true);
    toast.info("Playing");
  };

  const handleSongYtLogic = async () => {
    const authToken = Cookies.get("auth-cookie");
    try {
      const getDownloadInfo = await axios.get(
        API_URL + "/user/yt-download-link?url=" + newSong.url,
        {
          headers: { Authorization: "Bearer " + authToken },
        }
      );
      const downloadInfo = getDownloadInfo.data;
      if (downloadInfo.fileAvailable === true) {
        const res = await addDbEntry(downloadInfo, authToken);
        if (res === "error") {
          throw new Error("error");
        }
      }
      if (downloadInfo.fileAvailable === false) {
        const uploadedYtAudioDetails = await DownloadYtAudio(
          downloadInfo.url,
          authToken,
          newSong.url
        );
        if (uploadedYtAudioDetails.success === false) throw new Error("Error");
      }
    } catch (e) {
      console.log(e);
      toast.error("Error : Something Went wrong");
    }
  };

  async function DownloadYtAudio(url, authToken, sourceUrl) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: "https://iframe.y2meta-uk.com/",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch audio file");

      const blob = await response.blob();

      const formData = new FormData();

      formData.append("file", blob, "audio.mp3"); // Append Blob as a file

      const backendResponse = await axios.post(
        API_URL + "/user/upload-yt-audio?url=" + sourceUrl,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + authToken,
          },
        }
      );

      const audioData = backendResponse.data;

      const requestInfo = await addDbEntry(audioData, authToken);

      if (requestInfo === "error") throw new Error("error");

      return { success: true };

      // const audioBlob = new Blob([blob], { type: "audio/mp3" });

      // const blobUrl = URL.createObjectURL(audioBlob);

      // console.log("Blob URL:", blobUrl);

      // setTimeout(() => URL.revokeObjectURL(blobUrl), 600000);
    } catch (error) {
      console.error("Error:", error);
      return { success: false };
    }
  }

  const addDbEntry = async (downloadInfo, authToken) => {
    try {
      await axios.post(
        API_URL + "/user/yt-song-add",
        {
          title: newSong.name,
          url: newSong.url,
          fileName: downloadInfo.fileName,
          filePath: downloadInfo.filePath,
          duration: String(downloadInfo.duration),
        },
        {
          headers: { Authorization: "Bearer " + authToken },
        }
      );
      setNewSong({ name: "", url: "" });
      fetchSongs();
      toast.success("Song Added Successfully");
      return "success";
    } catch (e) {
      console.log(e);
      return "error";
    }
  };

  //  add song
  const handleAddSong = async () => {
    if (newSong.name.length > 2 && newSong.url) {
      toast.info("AddingSong... This might take some time");
      if (dialogPreference === true) setIsDialogOpen(false);
      await handleSongYtLogic();
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

    setCurrentSong(data);
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

  // const handlePlayListPlay = () => {
  //   if (shuffleStatus) {
  //     const duplicateSong = [...songs];
  //     const shuffledArray = shuffle(duplicateSong);
  //     setPlayingQueue(shuffledArray);
  //     setCurrentSong(shuffledArray[0]);
  //     setIsPlaying(true);
  //     toast.info("Playing Added Songs | Shuffle Enabled");
  //   } else {
  //     setPlayingQueue(songs);
  //     setCurrentSong(songs[0]);
  //     setIsPlaying(true);
  //     toast.info("Playing Added Songs | Shuffle Disabled");
  //   }
  // };

  const handleReShuffle = () => {
    const duplicateSong = [...songs];
    const shuffledArray = shuffle(duplicateSong);
    setPlayingQueue(shuffledArray);
    setCurrentSong(shuffledArray[0]);
    setIsPlaying(true);
    toast.info("Shuffled, Playing Now ....");
  };

  const handleSleepTimer = () => {
    const clearTimeoutFunction = () => {
      clearTimeout(sleepTimerId);
      toast.info("Stopped Sleep Timer");
    };
    if (sleepTimerInfo.status !== false) {
      if (sleepTimerId) {
        clearTimeoutFunction();
      }
      const timeoutId = setTimeout(() => {
        setSleepTimerId("");
        setSleepTimerInfo({
          status: false,
          sleepTime: 0,
          custom: false,
          value: "default",
        });
        togglePause();
      }, sleepTimerInfo.sleepTime * 60000);
      toast.info("Sleep Timer Enabled " + sleepTimerInfo.sleepTime + " min");
      setSleepTimerId(timeoutId);
      setIsSleepTimerDialogOpen(false);
      return;
    }
    clearTimeoutFunction();
    setIsSleepTimerDialogOpen(false);
  };

  const handleNext = () => {
    if (playingQueue.length - 1 > currentSongIndex)
      setCurrentSongIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentSongIndex > 1) {
      setCurrentSongIndex((prev) => prev - 1);
    }
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
        setIsDialogOpenDelete(false);
        setDeleteDetails("");

        return `Song has been Deleted`;
      },
      error: (res) => {
        return `Error : ${res.response.data.msg}`;
      },
    });
  };

  const getPosition = (id) => playingQueue.findIndex((item) => item.id === id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (Math.abs(event.delta.x) > 100) {
      setPlayingQueue((prev) => prev.filter((item) => item.id !== active.id));
      toast.info("Song removed from queue");
      return;
    }

    setPlayingQueue((items) => {
      const originalPos = getPosition(active.id);
      const newPos = getPosition(over.id);
      toast.info("Song Queue Updated");
      return arrayMove(items, originalPos, newPos);
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onClickAddToQueue = (each) => {
    const newId = uuidv4();
    const modifiedEach = { ...each, id: newId };

    if (playingQueue.length >= 1)
      setPlayingQueue((prev) => [...prev, modifiedEach]);
  };

  const handleAddSongAudio = (song) => {
    const authToken = Cookies.get("auth-cookie");
    const responseAddSong = axios.post(
      API_URL + "/user/song?type=audio",
      {
        id: song.id,
        title: song.song_name,
        url: song.download_link,
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
      error: () => {
        return `Error : Something Went Wrong`;
      },
    });
    if (dialogPreference === true) {
      setIsDialogOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 border-b">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl font-bold">Nottify</h1>
            <div className="flex items-center gap-2">
              {/* <PipButton /> */}
              <ThemeToggle />
              <Button
                className="ml-2 mr-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Songs
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <AlignJustify />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-fit mt-1">
                  {enableAdminButton ? (
                    <>
                      <DropdownMenuItem
                        className="p-2"
                        onClick={() => navigate("/admin")}
                      >
                        Admin
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuItem className="p-2" onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content - Liked Songs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-6">
            {showSearchMobile === false ? (
              <>
                <div className="flex flex-grow ">
                  <h2 className="text-2xl font-bold ">Your Songs</h2>
                  <div className="hidden md:flex justify-center flex-grow ">
                    <div className="flex items-center justify-center lg:w-2/4 md:w-3/4 border rounded-lg dark:bg-inherit ">
                      <input
                        className="w-full dark:bg-inherit outline-none  px-2.5 py-1"
                        placeholder="Search your songs"
                        type="search"
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(
                            e.target.value.toLocaleLowerCase()
                          );
                          const filteredData = songs.filter((each) =>
                            each.title
                              .toLowerCase()
                              .includes(e.target.value.toLowerCase())
                          );
                          setUserResultSongs(filteredData);
                        }}
                      />
                      <button className="bg-black text-white  dark:bg-white dark:text-black h-full  px-2.5 py-1 rounded-r-lg">
                        <Search />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex h-full items-center ">
                  <button
                    onClick={() => {
                      setShowSearchMobile(true);
                    }}
                    className="mx-4 md:hidden"
                  >
                    <Search />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <ListMusic />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <div className="rounded-lg  p-4">
                        <h1 className="text-xl mb-1 font-bold ">Queue</h1>
                        {playingQueue.length > 0 ? (
                          <p className="text-md  mt-4 mb-4">
                            <span className="font-bold mr-2">
                              {" "}
                              Currently Playing :
                            </span>
                            {"  "}
                            {currentSong.title}{" "}
                          </p>
                        ) : null}
                        {playingQueue.length > 1 ? (
                          <p className="text-md text-center mb-1 ">
                            Next Song in your playlist{" "}
                          </p>
                        ) : (
                          <p className="text-md text-center mb-2 mt-2 ">
                            Play / Add songs to Queue{" "}
                          </p>
                        )}
                        <DndContext
                          autoScroll={true}
                          sensors={sensors}
                          onDragEnd={handleDragEnd}
                          collisionDetection={closestCorners}
                        >
                          <ManageQueue
                            playingQueue={playingQueue}
                            currentSongIndex={currentSongIndex}
                          />
                        </DndContext>
                        {playingQueue.length > 1 ? (
                          <p className="text-xs text-center mt-2 ">
                            Swipe Left/Right to remove Song from Queue{" "}
                          </p>
                        ) : null}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* <button
                onClick={handleShuffle}
                className={`mx-2 rounded-full  flex justify-center p-0.5 w-10 ${
                  shuffleStatus === true
                    ? " dark:text-black dark:bg-white  text-white  bg-black"
                    : " dark:text-white text-black "
                } `}
              >
                <Shuffle className="h-8 w-6" />
              </button> */}

                  {/* {isPlaying === true ? (
                <PauseCircle className="cursor-pointer h-8 w-10" />
              ) : (
                <PlayCircle
                  onClick={handlePlayListPlay}
                  className="cursor-pointer h-8 w-10"
                />
              )} */}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center md:hidden w-full  dark:bg-inherit ">
                <input
                  className="w-full dark:bg-inherit outline-none  px-2.5 py-1 border rounded-lg"
                  placeholder="Search your songs"
                  type="search"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value.toLocaleLowerCase());
                    const filteredData = songs.filter((each) =>
                      each.title
                        .toLowerCase()
                        .includes(e.target.value.toLowerCase())
                    );
                    setUserResultSongs(filteredData);
                  }}
                />
                <button
                  onClick={() => {
                    setShowSearchMobile(false);
                  }}
                  className=" text-black  dark:text-white h-full  px-2.5 py-1 rounded-r-lg"
                >
                  <CircleX />
                </button>
              </div>
            )}
          </div>

          {userResultSongs.length > 0 && loading === false ? (
            <div className="flex-1 overflow-auto px-4">
              <div className="rounded-md border border-border  ">
                <div className="">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
                      <TableRow>
                        <TableHead className="w-2/4 lg:w-1/4  px-4 lg:px-8">
                          Title
                        </TableHead>
                        {document.documentElement.clientWidth > 1024 ? (
                          <TableHead>
                            <div>Source Link</div>
                          </TableHead>
                        ) : null}

                        <TableHead>Duration</TableHead>
                        <TableHead className="w-[30px] lg:w-[70px] "></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userResultSongs.map((song) => {
                        const getPlayingArr = songs.filter(
                          (each) => each.isPlaying === true
                        );
                        let playingId = 0;
                        if (getPlayingArr.length > 0) {
                          playingId = getPlayingArr[0].id;
                        }

                        return (
                          <TableRow
                            key={song.id}
                            className={`hover:bg-muted/70 cursor-pointer ${
                              playingId === song.id ? "bg-muted" : ""
                            }`}
                            onClick={() => onClickPlaySong(song)}
                          >
                            <TableCell className="font-medium px-4 lg:px-8">
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
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">
                                      More options
                                    </span>
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

                                  <DropdownMenuItem
                                    onClick={() => onClickAddToQueue(song)}
                                    disabled={
                                      playingQueue.length >= 1 ? false : true
                                    }
                                  >
                                    Add to Queue{" "}
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
            <div className="flex flex-col justify-center items-center h-2/3">
              <h1>No songs to show. Please add some songs</h1>
              <Button
                onClick={() => {
                  setIsDialogOpen(true);
                  setSearchQuery(userSearchQuery);
                }}
                className="mt-4"
              >
                Add songs
              </Button>
            </div>
          )}
        </div>

        {/* Add Song Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-foreground">
                Add Song
              </DialogTitle>
            </DialogHeader>
            <Tabs
              value={addSongTab}
              onValueChange={setAddSongTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="youtube">YouTube Link</TabsTrigger>
              </TabsList>
              <TabsContent value="search">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex">
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a song/movie name"
                        className="w-full rounded-r-none"
                      />
                      <Button
                        type="submit"
                        className="rounded-l-none bg-primary hover:bg-primary/90"
                      >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="mt-4 ">
                  <div className=" space-y-4 max-h-56">
                    {searchSuggestions.length > 0
                      ? searchSuggestions.map((song) => (
                          <div
                            key={song.id}
                            className="flex justify-between items-center p-2 bg-gray-100 rounded-md"
                          >
                            <span className="font-medium text-black">
                              {` ${song.song_name} - (${song.album}(${song.album_year})) `}
                            </span>
                            <Button
                              onClick={() => handleAddSongAudio(song)}
                              variant="outline"
                              size="sm"
                            >
                              Add
                            </Button>
                          </div>
                        ))
                      : searchQuery &&
                        searchQuery.length > 2 && (
                          <div className="text-center space-y-2 p-4 bg-gray-100 rounded-md">
                            <p className="text-gray-600">Song not found</p>
                            <Button
                              onClick={() => setAddSongTab("youtube")}
                              variant="outline"
                            >
                              Add using YouTube link
                            </Button>
                          </div>
                        )}
                  </div>
                </ScrollArea>
                <div className="flex w-full items-center mt-4 ">
                  <Checkbox
                    checked={dialogPreference}
                    onCheckedChange={(val) => setDialogPreference(val)}
                    id="onAddSong"
                  />

                  <label
                    htmlFor="onAddSong"
                    className="text-sm font-medium ml-4"
                  >
                    Close window when the Add button is clicked
                  </label>
                </div>
              </TabsContent>
              <TabsContent value="youtube">
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
                  <Button onClick={handleAddSong}>Add Song</Button>
                </div>
                <div className="flex w-full items-center mt-2 ">
                  <Checkbox
                    checked={dialogPreference}
                    onCheckedChange={(val) => setDialogPreference(val)}
                    id="onAddSong"
                  />

                  <label
                    htmlFor="onAddSong"
                    className="text-sm font-medium ml-4"
                  >
                    Close window when the Add Song button is clicked
                  </label>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="flex justify-between"></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update song title */}
        <Dialog open={isDialogOpenUpdate} onOpenChange={setIsDialogOpenUpdate}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-foreground">
                Edit Song
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
            </div>
            <DialogFooter className="flex justify-between">
              <Button onClick={handleUpdateSong}>Update Song </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* delete song */}
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

        <Dialog open={isRepeatDialogOpen} onOpenChange={setIsRepeatDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-foreground">
                Repeat Options
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup
                onValueChange={(e) => {
                  if (e === "custom") {
                    setRepeatStatus((prev) => ({
                      ...prev,
                      custom: true,
                      value: e,
                    }));
                    return;
                  }
                  if (e == "default") {
                    setRepeatStatus((prev) => ({
                      ...prev,
                      status: false,
                      times: 0,
                      custom: false,
                      value: e,
                    }));
                    setIsRepeatDialogOpen(false);
                    return;
                  }
                  setRepeatStatus((prev) => ({
                    ...prev,
                    status: true,
                    times: parseInt(e),
                    custom: false,
                    value: e,
                  }));
                  setIsRepeatDialogOpen(false);
                }}
                defaultValue={repeatStatus.value}
              >
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Off</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="1" id="r2" />
                  <Label htmlFor="r2">Repeat once</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="2" id="r3" />
                  <Label htmlFor="r3">Repeat twice</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="custom" id="r4" />
                  <Label htmlFor="r4">Custom</Label>
                </div>
                {repeatStatus.custom ? (
                  <div className="my-2">
                    <Input
                      value={repeatStatus.times}
                      onChange={(e) => {
                        setRepeatStatus((prev) => ({
                          ...prev,
                          status: true,
                          times: parseInt(e.target.value),
                        }));
                      }}
                      type="number"
                    />
                  </div>
                ) : null}
              </RadioGroup>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isSleepTimerDialogOpen}
          onOpenChange={setIsSleepTimerDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-foreground">
                Set Sleep Timer
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup
                onValueChange={(e) => {
                  if (e === "custom") {
                    setSleepTimerInfo((prev) => ({
                      ...prev,
                      custom: true,
                      status: true,
                      value: e,
                    }));
                    return;
                  }
                  if (e == "default") {
                    setSleepTimerInfo((prev) => ({
                      ...prev,
                      status: false,
                      sleepTime: 0,
                      custom: false,
                      value: e,
                    }));
                    return;
                  }
                  setSleepTimerInfo((prev) => ({
                    ...prev,
                    status: true,
                    sleepTime: parseInt(e),
                    custom: false,
                    value: e,
                  }));
                }}
                defaultValue={sleepTimerInfo.value}
              >
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Off</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="15" id="r2" />
                  <Label htmlFor="r2">15 minutes</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="30" id="r3" />
                  <Label htmlFor="r3">30 minutes</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="60" id="r4" />
                  <Label htmlFor="r4">1 hour</Label>
                </div>
                <div className="flex items-center space-x-2 my-2">
                  <RadioGroupItem value="custom" id="r5" />
                  <Label htmlFor="r5">Custom (in minutes)</Label>
                </div>

                {sleepTimerInfo.custom ? (
                  <div>
                    <Input
                      value={sleepTimerInfo.sleepTime}
                      onChange={(e) => {
                        setSleepTimerInfo((prev) => ({
                          ...prev,
                          status: true,
                          sleepTime: parseInt(e.target.value),
                        }));
                      }}
                      type="number"
                    />
                  </div>
                ) : null}
              </RadioGroup>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                onClick={() => {
                  handleSleepTimer();
                }}
              >
                Save
              </Button>
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
                    : currentSong.title}
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

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className=" h-8 w-8">
                        <MoreHorizontal />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setIsRepeatDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4 cursor-pointer px-2 py-2">
                          <Repeat />
                          {repeatStatus.status === false ? (
                            <p>No Repeat</p>
                          ) : (
                            <p>Repeat {repeatStatus.times} times</p>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setIsSleepTimerDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-4 px-2 py-2">
                          <Moon />
                          {sleepTimerInfo.status === false ? (
                            <p>Set Sleep Timer</p>
                          ) : (
                            <p>Sleep in {sleepTimerInfo.sleepTime} min</p>
                          )}
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <div className="flex items-center "></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
