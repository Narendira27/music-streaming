import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";
import { API_URL } from "@/lib/url";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("Check Now to view Status");
  const [statusType, setStatusType] = useState("default");
  const navigate = useNavigate();
  useEffect(() => {
    const authToken = Cookies.get("auth-cookie");
    axios
      .get(API_URL + "/admin/me", {
        headers: { Authorization: "Bearer " + authToken },
      })
      .then(() => {
        toast.success("Welcome, Admin");
      })
      .catch(() => {
        toast.error("You are not authorized");
        navigate("/");
      });
  }, []);
  const onClickCheckStatus = () => {
    const authToken = Cookies.get("auth-cookie");
    const res = axios.get(API_URL + "/admin/checkDownloadStatus", {
      headers: { Authorization: "Bearer " + authToken },
    });
    toast.promise(res, {
      loading: "Checking Status ... This might take some Time",
      success: () => {
        setStatus("Downloader is working properly");
        setStatusType("ok");
        return `Working Fine`;
      },
      error: (res) => {
        setStatus("Downloader is not working, update url to fix issue");
        setStatusType("fail");
        return `There is some issue with yt downloader`;
      },
    });
  };
  const onClickUpdateUrl = () => {
    const authToken = Cookies.get("auth-cookie");
    const res = axios.post(
      API_URL + "/admin/updateYTURL",
      { url },
      { headers: { Authorization: "Bearer " + authToken } }
    );
    toast.promise(res, {
      loading: "Updating Url ... This might take some Time",
      success: () => {
        return `Updated !!`;
      },
      error: (res) => {
        return `Issue with Updating try again later`;
      },
    });
  };
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">Admin Panel</CardTitle>
            <ThemeToggle />
          </div>
          <CardDescription>
            Manage download URL and check status
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Download URL</CardTitle>
            <CardDescription>Enter the new download URL below</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="url">Download URL</Label>
                  <Input
                    onChange={(e) => setUrl(e.target.value)}
                    value={url}
                    id="url"
                    name="url"
                    placeholder="https://example.com/download"
                  />
                </div>
              </div>
              <CardFooter className="flex justify-between mt-4 px-0">
                <Button onClick={onClickUpdateUrl}>Update URL</Button>
              </CardFooter>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download Status</CardTitle>
            <CardDescription>Check the current download status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusType === "default" ? (
              <div className="text-lg font-semibold ">{status}</div>
            ) : null}

            {statusType === "ok" ? (
              <div>
                <p className="text-lg font-semibold dark:text-green-400 text-green-400">
                  {status}
                </p>
              </div>
            ) : null}

            {statusType === "fail" ? (
              <div>
                <p className="text-lg font-semibold dark:text-red-400 text-red-400 ">
                  {status}
                </p>{" "}
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={onClickCheckStatus}>
              Check Status
            </Button>
          </CardFooter>
        </Card>
        <Button className="w-full" onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
