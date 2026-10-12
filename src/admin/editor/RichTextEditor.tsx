import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Button, cx, Field, Input, Switch } from '../ui/primitives';
import { Modal } from '../ui/overlays';
import { MediaPicker } from '../ui/media';

function ToolButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        'flex h-8 w-8 items-center justify-center rounded-md transition disabled:opacity-30',
        active ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-slate-200" />;

function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [href, setHref] = useState('');
  const [blank, setBlank] = useState(false);
  useEffect(() => {
    if (open) {
      const attrs = editor.getAttributes('link');
      setHref(attrs.href || '');
      setBlank(attrs.target === '_blank');
    }
  }, [open, editor]);
  const apply = () => {
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!href.trim()) chain.unsetLink().run();
    else chain.setLink({ href: href.trim(), target: blank ? '_blank' : null, rel: blank ? 'noopener noreferrer' : null }).run();
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Insérer un lien"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={apply}>
            Appliquer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Adresse" hint="Lien interne (ex. /contact/) ou externe (https://…)">
          <Input autoFocus value={href} onChange={(e) => setHref(e.target.value)} placeholder="/expertises/froid/" onKeyDown={(e) => e.key === 'Enter' && apply()} />
        </Field>
        <Switch checked={blank} onChange={setBlank} label="Ouvrir dans un nouvel onglet" />
      </div>
    </Modal>
  );
}

const cxRte = (minimal?: boolean) => (minimal ? 'rte-content rte-compact px-3.5 py-3' : 'rte-content px-4 py-3.5');

export function RichTextEditor({ value, onChange, placeholder = 'Rédigez votre contenu…', minimal }: { value: string; onChange: (html: string) => void; placeholder?: string; minimal?: boolean }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: { attributes: { class: cxRte(minimal) } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
    immediatelyRender: true,
  });

  // Synchronisation externe (restauration de révision, annulation)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(editor.isEmpty && !value)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold'),
      italic: e?.isActive('italic'),
      underline: e?.isActive('underline'),
      strike: e?.isActive('strike'),
      code: e?.isActive('code'),
      h2: e?.isActive('heading', { level: 2 }),
      h3: e?.isActive('heading', { level: 3 }),
      h4: e?.isActive('heading', { level: 4 }),
      p: e?.isActive('paragraph'),
      ul: e?.isActive('bulletList'),
      ol: e?.isActive('orderedList'),
      quote: e?.isActive('blockquote'),
      link: e?.isActive('link'),
      left: e?.isActive({ textAlign: 'left' }),
      center: e?.isActive({ textAlign: 'center' }),
      right: e?.isActive({ textAlign: 'right' }),
      canUndo: e?.can().undo(),
      canRedo: e?.can().redo(),
      words: e ? e.getText().split(/\s+/).filter(Boolean).length : 0,
    }),
  });

  if (!editor) return null;
  const c = () => editor.chain().focus();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/15">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-white/95 px-2 py-1.5 backdrop-blur">
        {!minimal ? (
          <>
            <ToolButton title="Paragraphe" active={s?.p} onClick={() => c().setParagraph().run()}>
              <Pilcrow className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Titre H2" active={s?.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Titre H3" active={s?.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Titre H4" active={s?.h4} onClick={() => c().toggleHeading({ level: 4 }).run()}>
              <Heading4 className="h-4 w-4" />
            </ToolButton>
            <Sep />
          </>
        ) : null}
        <ToolButton title="Gras (Ctrl+B)" active={s?.bold} onClick={() => c().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Italique (Ctrl+I)" active={s?.italic} onClick={() => c().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Souligné (Ctrl+U)" active={s?.underline} onClick={() => c().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Barré" active={s?.strike} onClick={() => c().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        {!minimal ? (
          <ToolButton title="Code" active={s?.code} onClick={() => c().toggleCode().run()}>
            <Code className="h-4 w-4" />
          </ToolButton>
        ) : null}
        <Sep />
        <ToolButton title="Liste à puces" active={s?.ul} onClick={() => c().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Liste numérotée" active={s?.ol} onClick={() => c().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        {!minimal ? (
          <>
            <ToolButton title="Citation" active={s?.quote} onClick={() => c().toggleBlockquote().run()}>
              <Quote className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Séparateur" onClick={() => c().setHorizontalRule().run()}>
              <Minus className="h-4 w-4" />
            </ToolButton>
            <Sep />
            <ToolButton title="Aligner à gauche" active={s?.left} onClick={() => c().setTextAlign('left').run()}>
              <AlignLeft className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Centrer" active={s?.center} onClick={() => c().setTextAlign('center').run()}>
              <AlignCenter className="h-4 w-4" />
            </ToolButton>
            <ToolButton title="Aligner à droite" active={s?.right} onClick={() => c().setTextAlign('right').run()}>
              <AlignRight className="h-4 w-4" />
            </ToolButton>
          </>
        ) : null}
        <Sep />
        <ToolButton title="Lien (Ctrl+K)" active={s?.link} onClick={() => setLinkOpen(true)}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        {s?.link ? (
          <ToolButton title="Retirer le lien" onClick={() => c().unsetLink().run()}>
            <Link2Off className="h-4 w-4" />
          </ToolButton>
        ) : null}
        {!minimal ? (
          <ToolButton title="Insérer une image" onClick={() => setMediaOpen(true)}>
            <ImagePlus className="h-4 w-4" />
          </ToolButton>
        ) : null}
        <div className="ml-auto flex items-center gap-0.5">
          <span className="mr-2 hidden text-xs tabular-nums text-slate-400 sm:inline">{s?.words ?? 0} mots</span>
          <ToolButton title="Annuler (Ctrl+Z)" disabled={!s?.canUndo} onClick={() => c().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolButton>
          <ToolButton title="Rétablir (Ctrl+Maj+Z)" disabled={!s?.canRedo} onClick={() => c().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>
      <EditorContent
        editor={editor}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            setLinkOpen(true);
          }
        }}
      />
      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
      <MediaPicker
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(a) => c().setImage({ src: a.url, alt: a.alt || '' }).run()}
      />
    </div>
  );
}
