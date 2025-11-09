import { execSync } from "child_process";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";

import { useState } from "react";

import {
    Action,
    ActionPanel,
    Form,
    Icon,
    open,
    popToRoot,
    showToast,
    Toast,
    getPreferenceValues,
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

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          if (response.headers.location) {
            downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            return;
          }
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function fetchIconUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        let html = "";

        response.on("data", (chunk) => {
          html += chunk;
        });

        response.on("end", () => {
          const patterns = [
            /rel="apple-touch-icon"[^>]*href="([^"]*)"/i,
            /rel="icon"[^>]*href="([^"]*\.png)"/i,
            /rel="shortcut icon"[^>]*href="([^"]*)"/i,
            /rel="icon"[^>]*href="([^"]*)"/i,
          ];

          let iconUrl: string | null = null;

          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              iconUrl = match[1];
              break;
            }
          }

          if (!iconUrl) {
            iconUrl = "/favicon.ico";
          }

          const baseUrl = new URL(url).origin;
          if (iconUrl.startsWith("/")) {
            resolve(baseUrl + iconUrl);
          } else if (iconUrl.startsWith("http")) {
            resolve(iconUrl);
          } else {
            resolve(baseUrl + "/" + iconUrl);
          }
        });
      })
      .on("error", () => {
        resolve(null);
      });
  });
}

async function createWebApp(values: FormValues) {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Creating web app...",
  });

  try {
    const preferences = getPreferenceValues<Preferences>();
    const { appName, url, chromeFlags } = values;

    // Validate URL
    if (!url.match(/^https?:\/\//)) {
      throw new Error("URL must start with http:// or https://");
    }

    // Determine installation directory
    const APPLICATIONS_DIR =
      preferences.installLocation === "system"
        ? "/Applications"
        : path.join(process.env.HOME!, "Applications", "WebApps");

    // Create app bundle structure
    const appBundle = path.join(APPLICATIONS_DIR, `${appName}.app`);
    
    // Remove existing app if it exists
    if (fs.existsSync(appBundle)) {
      fs.rmSync(appBundle, { recursive: true, force: true });
    }

    const contentsDir = path.join(appBundle, "Contents");
    const macosDir = path.join(contentsDir, "MacOS");
    const resourcesDir = path.join(contentsDir, "Resources");

    fs.mkdirSync(macosDir, { recursive: true });
    fs.mkdirSync(resourcesDir, { recursive: true });

    toast.message = "Downloading icon...";

    // Fetch and save icon (simplified - no conversion)
    let iconFileName = "";
    try {
      const iconUrl = await fetchIconUrl(url);
      if (iconUrl) {
        // Determine icon extension from URL
        let iconExt = "png";
        if (iconUrl.match(/\.png$/i)) iconExt = "png";
        else if (iconUrl.match(/\.ico$/i)) iconExt = "ico";
        else if (iconUrl.match(/\.jpg$/i) || iconUrl.match(/\.jpeg$/i)) iconExt = "jpg";
        
        const iconPath = path.join(resourcesDir, `app.${iconExt}`);
        
        await downloadFile(iconUrl, iconPath);

        if (fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0) {
          iconFileName = `app.${iconExt}`;
          toast.message = "Icon downloaded successfully";
        }
      }
    } catch (error) {
      console.error("Icon error:", error);
      toast.message = "Continuing without icon...";
    }

    toast.message = "Creating launcher...";

    // Create launcher script
    const launcherScript = path.join(macosDir, appName);
    const chromeOptsStr = chromeFlags ? ` ${chromeFlags}` : "";
    const chromePath = preferences.chromeExecutable || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    const launcherContent = `#!/bin/bash

# Kill any existing instances for this app
pkill -f "user-data-dir.*WebApps/${appName}" 2>/dev/null || true

# Wait a moment for the process to die
sleep 0.5

# Launch Chrome in app mode
exec "${chromePath}" \\
    --new-window \\
    --app="${url}" \\
    --class="${appName}" \\
    --user-data-dir="$HOME/Library/Application Support/Google/Chrome/WebApps/${appName}"${chromeOptsStr} \\
    "$@" 2>/dev/null
`;

    fs.writeFileSync(launcherScript, launcherContent);
    fs.chmodSync(launcherScript, "755");

    // Create Info.plist
    const infoPlist = path.join(contentsDir, "Info.plist");
    const iconEntry = iconFileName
      ? `    <key>CFBundleIconFile</key>
    <string>${iconFileName}</string>\n`
      : "";

    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${appName}</string>
    <key>CFBundleIdentifier</key>
    <string>com.webapp.${appName.toLowerCase().replace(/\s+/g, '')}</string>
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
${iconEntry}    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
`;

    fs.writeFileSync(infoPlist, plistContent);

    // Force macOS to recognize the new app
    try {
      execSync(`touch "${appBundle}"`, { stdio: "ignore" });
      execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${appBundle}"`, { 
        stdio: "ignore" 
      });
    } catch (error) {
      console.error("Failed to register app:", error);
    }

    toast.style = Toast.Style.Success;
    toast.title = `${appName} created successfully!`;
    toast.message = "Restarting Dock to refresh icons...";

    // Restart Dock to refresh icon cache
    try {
      execSync('killall Dock', { stdio: "ignore" });
    } catch (error) {
      console.error("Failed to restart Dock:", error);
    }

    // Give macOS a moment to register the app
    await new Promise(resolve => setTimeout(resolve, 1500));

    await open(appBundle);
    await popToRoot();
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to create web app";
    toast.message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating web app:", error);
  }
}

export default function Command() {
  const [url, setUrl] = useState("");
  const [appName, setAppName] = useState("");

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!appName && newUrl) {
      try {
        const domain = new URL(newUrl).hostname.replace(/^www\./, "");
        const name = domain.split(".")[0];
        setAppName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Create Web App"
            icon={Icon.Plus}
            onSubmit={createWebApp}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="url"
        title="URL"
        placeholder="https://example.com"
        value={url}
        onChange={handleUrlChange}
        info="The URL of the web application"
      />
      <Form.TextField
        id="appName"
        title="App Name"
        placeholder="Example"
        value={appName}
        onChange={setAppName}
        info="Name for the application (auto-filled from URL)"
      />
      <Form.TextField
        id="chromeFlags"
        title="Chrome Flags"
        placeholder="--enable-features=SomeFeature (optional)"
        info="Additional Chrome flags to pass (optional)"
      />
    </Form>
  );
}