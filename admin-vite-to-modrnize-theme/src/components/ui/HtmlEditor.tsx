import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const MenuButton = ({ onClick, active, children, title }: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      'p-1.5 rounded-md transition-all text-text-muted hover:text-text-main hover:bg-content-bg',
      active && 'bg-primary-100 text-primary-700 shadow-sm'
    )}
  >
    {children}
  </button>
);

export function HtmlEditor({ value, onChange, placeholder = 'Write your email content here...', minHeight = 300 }: HtmlEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary-600 underline hover:text-primary-700' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] px-4 py-3 text-sm text-text-main',
      },
    },
  });

  // Update content when value prop changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const addImage = React.useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = React.useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div id={id} className="border border-border-theme rounded-xl overflow-hidden bg-card-bg shadow-sm transition-all focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-400">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border-theme bg-content-bg/30">
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
          <Code className="h-3.5 w-3.5" />
        </MenuButton>

        <span className="w-px h-5 bg-border-theme mx-1" />

        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </MenuButton>

        <span className="w-px h-5 bg-border-theme mx-1" />

        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </MenuButton>

        <span className="w-px h-5 bg-border-theme mx-1" />

        <MenuButton onClick={addLink} active={editor.isActive('link')} title="Link">
          <Link className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={addImage} title="Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </MenuButton>

        <span className="w-px h-5 bg-border-theme mx-1" />

        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-3.5 w-3.5" />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-3.5 w-3.5" />
        </MenuButton>
      </div>
      <EditorContent editor={editor} className="[&_.ProseMirror]:outline-none" />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
        .ProseMirror a {
          color: #7c3aed;
          text-decoration: underline;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 12px;
          color: #6b7280;
          font-style: italic;
        }
        .ProseMirror pre {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 12px;
          font-family: monospace;
          font-size: 12px;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 24px;
        }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 12px 0 8px; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 10px 0 6px; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 8px 0 4px; }
        .ProseMirror p { margin: 4px 0; line-height: 1.6; }
      `}</style>
    </div>
  );
}
