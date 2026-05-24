import Editor from "@monaco-editor/react";

function CodingRoom() {
  return (
    <div className="h-screen">
      <Editor
        height="100vh"
        defaultLanguage="javascript"
        defaultValue="// Start coding..."
        theme="vs-dark"
      />
    </div>
  );
}

export default CodingRoom;
