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
    const req = client.get(url, { headers: { "User-Agent": "Raycast-WebApp-Creator/1.0" } }, (res) => {
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });

    req.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function convertToIcns(src: string, dest: string): Promise<void> {
  const iconset = dest.replace(".icns", ".iconset");
  fs.mkdirSync(iconset, { recursive: true });

  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const s of sizes) {
    execSync(`sips -z ${s} ${s} "${src}" --out "${iconset}/icon_${s}x${s}.png"`, { stdio: "ignore" });
    fs.copyFileSync(`${iconset}/icon_${s}x${s}.png`, `${iconset}/icon_${s}x${s}@2x.png`);
  }
  execSync(`iconutil -c icns "${iconset}" -o "${dest}"`);
  fs.rmSync(iconset, { recursive: true, force: true });
}

async function fetchBestIcon(url: string): Promise<string | null> {
  const origin = new URL(url).origin;
  const candidates = [
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/favicon.ico`,
    `${origin}/favicon.png`,
    `${origin}/safari-pinned-tab.svg`,
  ];

  for (const u of candidates) {
    const tmp = path.join(os.tmpdir(), `webapp-icon-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try {
      await downloadFile(u, tmp);
      if (fs.statSync(tmp).size > 800) return tmp;
      fs.unlinkSync(tmp);
    } catch {}
  }

  // HTML fallback
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "Raycast" } }).on("response", (res) => {
      let html = "";
      res.on("data", (c) => (html += c));
      res.on("end", () => {
        const match = html.match(/rel=["'](apple-touch-icon|shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i);
        const iconUrl = match?.[2] ? new URL(match[2], url).href : `${origin}/favicon.ico`;
        const tmp = path.join(os.tmpdir(), `fallback-${Date.now()}`);
        downloadFile(iconUrl, tmp).then(() => resolve(tmp)).catch(() => resolve(null));
      });
    }).on("error", () => resolve(null));
  });
}

async function createWebApp(values: FormValues) {
  const toast = await showToast({ style: Toast.Style.Animated, title: "Creating web app..." });

  try {
    const { appName, url: rawUrl, chromeFlags } = values;
    const prefs = getPreferenceValues<Preferences>();

    const url = rawUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) throw new Error("Invalid URL – must start with http:// or https://");

    const chromePath = prefs.chromeExecutable || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    if (!fs.existsSync(chromePath)) throw new Error("Google Chrome not found at:\n" + chromePath);

    const appsDir = prefs.installLocation === "system"
      ? "/Applications"
      : path.join(os.homedir(), "Applications", "WebApps");
    fs.mkdirSync(appsDir, { recursive: true });

    const appBundle = path.join(appsDir, `${appName}.app`);
    if (fs.existsSync(appBundle)) fs.rmSync(appBundle, { recursive: true, force: true });

    const contents = path.join(appBundle, "Contents");
    const macos = path.join(contents, "MacOS");
    const resources = path.join(contents, "Resources");
    fs.mkdirSync(macos, { recursive: true });
    fs.mkdirSync(resources, { recursive: true });

    // === Icon ===
    toast.message = "Fetching icon...";
    let iconFileName = "icon.icns";
    const iconPath = path.join(resources, iconFileName);

    try {
      const tmpIcon = await fetchBestIcon(url);
      if (tmpIcon && fs.statSync(tmpIcon).size > 1000) {
        await convertToIcns(tmpIcon, iconPath);
        fs.unlinkSync(tmpIcon);
      } else {
        throw new Error("Invalid");
      }
    } catch {
      const fallback = path.join(environment.assetsPath, "fallback-icon.png");
      if (fs.existsSync(fallback)) {
        await convertToIcns(fallback, iconPath);
      } else {
        iconFileName = "";
      }
      toast.message = "Using fallback icon";
    }

    // === Launcher Script ===
    toast.message = "Creating launcher...";
    const templatePath = path.join(environment.assetsPath, "launcher-template.sh");
    if (!fs.existsSync(templatePath)) throw new Error("Missing assets/launcher-template.sh");

    const userDataDir = path.join(os.homedir(), "Library/Application Support/Google/Chrome/WebApps", appName);

    let script = fs.readFileSync(templatePath, "utf-8");
    script = script
      .replace(/__APP_NAME__/g, appName)
      .replace(/__CHROME_PATH__/g, chromePath)
      .replace(/__APP_URL__/g, url)
      .replace(/__USER_DATA_DIR__/g, userDataDir)
      .replace(/__CHROME_FLAGS__/g, chromeFlags.trim() ? ` ${chromeFlags.trim()}` : "");

    const launcherPath = path.join(macos, appName);
    fs.writeFileSync(launcherPath, script);
    fs.chmodSync(launcherPath, 0o755);

    // === Info.plist ===
    const bundleId = `com.josephchambers.webapp.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const iconEntry = iconFileName ? `    <key>CFBundleIconFile</key>\n    <string>${iconFileName}</string>\n` : "";

    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${appName}</string>
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

    // === Finalize ===
    execSync(`touch "${appBundle}"`);
    execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${appBundle}"`, { stdio: "ignore" });
    execSync(`killall Dock`, { stdio: "ignore" });

    await new Promise((r) => setTimeout(r, 1000));

    toast.style = Toast.Style.Success;
    toast.title = `${appName} created!`;
    toast.message = "Opening now...";

    await closeMainWindow();
    await open(appBundle);
    await popToRoot();
  } catch (err) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to create app",
      message: err instanceof Error ? err.message : "Unknown error",
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
          <Action.SubmitForm
            title="Create Web App"
            icon={Icon.PlusCircleFilled}
            onSubmit={createWebApp}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="url"
        title="Website URL"
        placeholder="https://music.youtube.com"
        value={url}
        onChange={setUrl}
        autoFocus
      />
      <Form.TextField
        id="appName"
        title="App Name"
        placeholder="Youtube Music"
        value={appName}
        onChange={setAppName}
        info="Appears in Dock, Launchpad, and Mission Control"
      />
      <Form.TextField
        id="chromeFlags"
        title="Extra Chrome Flags (Optional)"
        placeholder="--start-maximized --force-dark-mode"
        info="Space-separated flags. Use carefully."
      />
      <Form.Separator />
      <Form.Description text="Creates beautiful native macOS apps from any website using Chrome in app mode. Each app gets its own profile, icon, and window class." />
    </Form>
  );
}