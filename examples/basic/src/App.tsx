import { useRef } from "react";
import {
  SmartPage,
  type SmartPageRef,
  forBlock,
  ifBlock,
  readonlyBlock,
} from "smartpage";

function App() {
  const editorRef = useRef<SmartPageRef>(null);
  const blocks = [forBlock, ifBlock, readonlyBlock];

  return (
    <div className="h-screen flex flex-col bg-background">
      <SmartPage
        ref={editorRef}
        placeholder="Start typing your document..."
        canvas="a4"
        toolbar="full"
        variables={[
          { key: "first_name", label: "First Name" },
          { key: "last_name", label: "Last Name" },
          { key: "email", label: "Email Address" },
          { key: "company", label: "Company" },
          { key: "date", label: "Date" },
        ]}
        blocks={blocks}
        className="flex-1"
        readOnly={true}
        showToolbar={true}
        actions={{
          import: true,
          preview: true,
          print: true,
          export: true,
        }}
      />
    </div>
  );
}

export default App;
