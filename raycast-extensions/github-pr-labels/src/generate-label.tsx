import { useState } from "react";

import { ActionPanel, Action, List, Clipboard, closeMainWindow, showToast, Toast, showHUD } from "@raycast/api";

type Style = "Passing" | "Optional" | "Blocking";

const styles: { name: Style; color: string }[] = [
  { name: "Passing", color: "#28A745" },
  { name: "Optional", color: "#007BFF" },
  { name: "Blocking", color: "#DC3545" },
];

export default function Command() {
  const [attempts, setAttempts] = useState(0);
  const [title, setTitle] = useState("Example");
  const sanitizedTitle = encodeURIComponent(title).toLowerCase();

  const chooseStyle = (style: Style) => {
    let finalTitle = title;
    if (!title) {
      setAttempts(attempts + 1);
      const message = () => {
        if (attempts <= 1) {
          return "Please type something";
        } else if (attempts <= 3) {
          return "Seriously, type something";
        } else if (attempts <= 5) {
          return "I'm not kidding, type something";
        } else {
          return "OK fine, don't type anything";
        }
      };
      if (attempts <= 5) {
        showToast({
          title: message(),
          style: Toast.Style.Failure,
        });
        return;
      }
      showHUD(message());

      style = "Blocking";
      finalTitle = "I'm a failure and I know it";
    }
    const markdown = `![${style}: ${finalTitle}](https://gh-labels.chamberslab.casa/${style.toLowerCase()}/${sanitizedTitle}.svg)`;

    Clipboard.copy(markdown);
    closeMainWindow();
    Clipboard.paste(markdown);
  };

  return (
    <List
      navigationTitle="Generate a Github Label"
      searchBarPlaceholder="What do you want it to say?"
      filtering={false}
      onSearchTextChange={(text) => setTitle(text)}
    >
      {styles.map(({ name, color }) => (
        <List.Item
          title={name}
          key={name}
          icon={`${name.toLowerCase()}.png`}
          accessories={[{ tag: { value: (title || "Example").toUpperCase(), color } }]}
          actions={
            <ActionPanel>
              <Action title={"Build Label"} onAction={chooseStyle.bind(null, name)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
