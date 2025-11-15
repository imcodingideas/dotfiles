import { execSync } from "child_process";
import fs from "fs";
import http from "http";
import https from "https";
import os from "os";
import path from "path";

import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  closeMainWindow,
  environment,
  Form,
  getPreferenceValues,
  Icon,
  open,
  popToRoot,
  showToast,
  Toast,
} from "@raycast/api";

const assetsPath = environment.assetsPath;

interface Preferences {
  chromeExecutable: string;
  installLocation: "user" | "system";
}

interface FormValues {
  appName: string;
  url: string;
  chromeFlags: string;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { headers: { "User-Agent": "Raycast" } }, (res) => {
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => req.destroy() || reject(new Error("Timeout")));
  });
}

async function fetchBestIcon(url: string): Promise<string | null> {
  const origin = new URL(url).origin;
  const candidates = [
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/favicon.ico`,
    `${origin}/favicon.png`,
  ];

  for (const u of candidates) {
    const tmp = path.join(os.tmpdir(), `icon-${Date.now()}-${Math.random().toString(36)}`);
    try {
      await downloadFile(u, tmp);
      if (fs.statSync(tmp).size > 500) {
        if (u.endsWith(".ico")) {
          const png = tmp + ".png";
          try {
            execSync(`sips -s format png "${tmp}" --out "${png}"`, { stdio: "ignore" });
            fs.unlinkSync(tmp);
            return png;
          } catch {}
        }
        return tmp;
      }
      fs.unlinkSync(tmp);
    } catch {}
  }
  return null;
}

async function createWebApp(values: FormValues) {
  const toast = await showToast({ style: Toast.Style.Animated, title: "Creating app..." });

  try {
    let { appName, url: rawUrl, chromeFlags } = values;
    const prefs = getPreferenceValues<Preferences>();

    appName = appName.trim() || "Web App";
    const safeAppName = appName.replace(/[^a-zA-Z0-9 -]/g, "").trim();
    if (!safeAppName) throw new Error("Invalid app name");

    const url = rawUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) throw new Error("Invalid URL");

    const chromePath = prefs.chromeExecutable || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (!fs.existsSync(chromePath)) throw new Error("Chrome not found");

    const appsDir = prefs.installLocation === "system"
      ? "/Applications"
      : path.join(os.homedir(), "Applications", "WebApps");
    fs.mkdirSync(appsDir, { recursive: true });

    const appBundle = path.join(appsDir, `${safeAppName}.app`);
    if (fs.existsSync(appBundle)) fs.rmSync(appBundle, { recursive: true, force: true });

    const contents = path.join(appBundle, "Contents");
    const macos = path.join(contents, "MacOS");
    const resources = path.join(contents, "Resources");
    fs.mkdirSync(macos, { recursive: true });
    fs.mkdirSync(resources, { recursive: true });

    toast.message = "Getting icon...";
    let iconFileName = "icon.png";
    const iconPath = path.join(resources, iconFileName);

    const tmpIcon = await fetchBestIcon(url);
    if (tmpIcon && fs.statSync(tmpIcon).size > 500) {
      fs.copyFileSync(tmpIcon, iconPath);
      fs.unlinkSync(tmpIcon);
      toast.message = "Icon ready";
    } else {
      if (tmpIcon) fs.unlinkSync(tmpIcon);
      const fallback = path.join(assetsPath, "fallback-icon.png");
      if (fs.existsSync(fallback)) {
        fs.copyFileSync(fallback, iconPath);
        toast.message = "Using fallback icon";
      } else {
        iconFileName = "";
        toast.message = "No icon";
      }
    }

    // === Launcher ===
    toast.message = "Creating launcher...";
    const templatePath = path.join(assetsPath, "launcher-template.sh");
    if (!fs.existsSync(templatePath)) throw new Error("Missing launcher-template.sh");

    const userDataDir = path.join(os.homedir(), "Library/Application Support/Google/Chrome/WebApps", safeAppName);

    let script = fs.readFileSync(templatePath, "utf-8");
    script = script
      .replace(/__APP_NAME__/g, safeAppName)
      .replace(/__CHROME_PATH__/g, chromePath)
      .replace(/__APP_URL__/g, url)
      .replace(/__USER_DATA_DIR__/g, userDataDir)
      .replace(/__CHROME_FLAGS__/g, chromeFlags.trim() ? ` ${chromeFlags.trim()}` : "");

    const launcherPath = path.join(macos, safeAppName);
    fs.writeFileSync(launcherPath, script);
    fs.chmodSync(launcherPath, 0o755);

    // === Info.plist ===
    const bundleId = `com.imcodingideas.webapp.${safeAppName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const iconEntry = iconFileName ? `    <key>CFBundleIconFile</key>\n    <string>${iconFileName}</string>\n` : "";

    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${safeAppName}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
${iconEntry}</dict>
</plist>`;

    fs.writeFileSync(path.join(contents, "Info.plist"), plist);

    try {
      execSync(`touch "${appBundle}"`);
      execSync(`/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "${appBundle}"`, { stdio: "ignore" });

      const iconFile = path.join(resources, "icon.png");
      if (fs.existsSync(iconFile)) {
        execSync(`touch "${iconFile}"`);
        execSync(`xattr -cr "${appBundle}"`);
      }

      execSync(`killall Dock`, { stdio: "ignore" });
      execSync(`killall Finder`, { stdio: "ignore" });
    } catch {}

    await new Promise(r => setTimeout(r, 1200));

    toast.style = Toast.Style.Success;
    toast.title = `${appName} ready!`;
    toast.message = "Opening...";

    await closeMainWindow();
    await open(appBundle);
    await popToRoot();

  } catch (err: any) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed",
      message: err?.message || "Unknown error",
    });
  }
}

export default function Command() {
  const [url, setUrl] = useState("");
  const [appName, setAppName] = useState("");

  useEffect(() => {
    if (!appName && url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        const name = hostname.split(".")[0];
        setAppName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch {}
    }
  }, [url]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Web App" icon={Icon.PlusCircleFilled} onSubmit={createWebApp} />
        </ActionPanel>
      }
    >
      <Form.TextField id="url" title="Website URL" placeholder="https://music.youtube.com" value={url} onChange={setUrl} autoFocus />
      <Form.TextField id="appName" title="App Name" placeholder="YouTube Music" value={appName} onChange={setAppName} />
      <Form.TextField id="chromeFlags" title="Extra Chrome Flags" placeholder="--start-maximized" />
      <Form.Separator />
      <Form.Description text="Simple. Fast. Icons always work. Like the good old days." />
    </Form>
  );
}