import { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import {
  CaptureUpdateAction,
  useExcalidrawAPI,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import { newImageElement } from "@excalidraw/element";
import type { BinaryFileData, DataURL } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/element/types";
import library from "./infra-basica.json";
import "./NgSymbols.scss";

const KEY = "excalidrawng-symbols-v1";
const SOURCES = {
  Azure: "https://learn.microsoft.com/en-us/azure/architecture/icons/",
  AWS: "https://aws.amazon.com/architecture/icons/",
  "Google Cloud": "https://cloud.google.com/icons",
  "Microsoft 365":
    "https://learn.microsoft.com/en-us/previous-versions/microsoft-365/solutions/architecture-icons-templates",
  Dell: "https://www.visiocafe.com/dell.htm",
  Database: "",
  Rede: "",
  Outros: "",
};
type Category = keyof typeof SOURCES;
type SymbolAsset = {
  id: string;
  name: string;
  category: Category;
  width: number;
  height: number;
  dataURL: DataURL;
};

// SVGs are decoded only as images, never inserted into the DOM as markup.
// Reject active/external content before decoding, including external CSS URLs.
export const isPassiveSvg = (text: string) =>
  !/<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?!#)|url\(\s*["']?\s*(?!#)/i.test(
    text,
  );

export const NgSymbols = () => {
  const api = useExcalidrawAPI();
  const root = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<SymbolAsset[]>([]);
  const [category, setCategory] = useState<Category>("Azure");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    get<SymbolAsset[]>(KEY)
      .then((items) => {
        if (live) {
          setAssets(items || []);
          setReady(true);
        }
      })
      .catch(() => {
        if (live) {
          setStatus("Não foi possível abrir o catálogo local.");
          setReady(true);
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const importFiles = async (files: FileList | null) => {
    const doc = root.current?.ownerDocument;
    const win = doc?.defaultView;
    if (!files || !doc || !win || busy || !ready) {
      return;
    }
    setBusy(true);
    const selectedFiles = Array.from(files);
    const imported: SymbolAsset[] = [];
    const rejected: string[] = [];
    for (const file of selectedFiles.slice(0, 100)) {
      try {
        if (file.size > 2 * 1024 * 1024 || !/\.(svg|png)$/i.test(file.name)) {
          throw new Error("Formato ou tamanho inválido");
        }
        if (/\.svg$/i.test(file.name) && !isPassiveSvg(await file.text())) {
          throw new Error("SVG ativo/externo");
        }
        const dataURL = await new Promise<string>((resolve, reject) => {
          const reader = new win.FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = doc.createElement("img");
        img.src = dataURL;
        await img.decode();
        if (
          !img.naturalWidth ||
          !img.naturalHeight ||
          img.naturalWidth > 8192 ||
          img.naturalHeight > 8192
        ) {
          throw new Error("Dimensões inválidas");
        }
        const ratio = Math.min(
          1,
          512 / Math.max(img.naturalWidth, img.naturalHeight),
        );
        const canvas = doc.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
        canvas
          .getContext("2d")!
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL("image/png") as DataURL;
        const hash = await win.crypto.subtle.digest(
          "SHA-256",
          new win.TextEncoder().encode(category + png),
        );
        const id = Array.from(new Uint8Array(hash))
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("");
        imported.push({
          id,
          name: file.name.replace(/\.(svg|png)$/i, ""),
          category,
          width: canvas.width,
          height: canvas.height,
          dataURL: png,
        });
      } catch {
        rejected.push(file.name);
      }
    }
    const next = [
      ...new Map([...assets, ...imported].map((a) => [a.id, a])).values(),
    ];
    try {
      await set(KEY, next);
      setAssets(next);
      setStatus(
        `${imported.length} arquivo(s) processado(s). ${
          rejected.length
        } rejeitado(s).${
          selectedFiles.length > 100 ? " Limite: 100 arquivos por lote." : ""
        }`,
      );
    } catch {
      setStatus("Não foi possível salvar. Verifique o espaço do navegador.");
    }
    setBusy(false);
  };

  const insert = (asset: SymbolAsset) => {
    if (!api) {
      return;
    }
    const state = api.getAppState();
    const point = viewportCoordsToSceneCoords(
      {
        clientX: state.offsetLeft + state.width / 2,
        clientY: state.offsetTop + state.height / 2,
      },
      state,
    );
    const scale = 96 / Math.max(asset.width, asset.height);
    const width = asset.width * scale;
    const height = asset.height * scale;
    const file: BinaryFileData = {
      id: asset.id as FileId,
      dataURL: asset.dataURL,
      mimeType: "image/png",
      created: Date.now(),
    };
    const element = newImageElement({
      type: "image",
      x: point.x - width / 2,
      y: point.y - height / 2,
      width,
      height,
      fileId: file.id,
      status: "saved",
    });
    api.addFiles([file]);
    api.updateScene({
      elements: [...api.getSceneElements(), element],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  return (
    <div className="ng-symbols" ref={root}>
      <h3>Símbolos NG</h3>
      <button
        type="button"
        onClick={async () => {
          const win = root.current?.ownerDocument.defaultView;
          if (!win) {
            return;
          }
          try {
            await api?.updateLibrary({
              libraryItems: new win.Blob([JSON.stringify(library)], {
                type: "application/vnd.excalidrawlib+json",
              }),
              merge: true,
              openLibraryMenu: true,
            });
          } catch {
            setStatus("Falha ao adicionar biblioteca básica.");
          }
        }}
      >
        Adicionar 18 símbolos básicos à biblioteca
      </button>
      <p>
        Celular, tablet, rede, servidores e outros elementos editáveis. Não
        substitui sua biblioteca.
      </p>
      <label>
        Categoria
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {Object.keys(SOURCES).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {SOURCES[category] && (
        <a href={SOURCES[category]} target="_blank" rel="noreferrer">
          Obter arquivos na fonte de {category}
        </a>
      )}
      <p>
        Baixe o pacote autorizado e extraia os SVGs ou PNGs. Confira os termos
        do fornecedor antes de importar. Dell: redistribuição ainda não
        validada. Os ícones de marcas não estão incluídos neste repositório.
      </p>
      <label>
        Importar SVG/PNG (até 2 MB cada)
        <input
          aria-label="Importar símbolos"
          disabled={!ready || busy}
          type="file"
          accept=".svg,.png"
          multiple
          onChange={(e) => {
            void importFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <label>
        Buscar
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: storage, firewall, Teams"
        />
      </label>
      <p>
        Importações ficam neste navegador. Clique para inserir; depois mova e
        redimensione no desenho. Imagens oficiais não viram formas editáveis.
        Exporte seus desenhos para backup.
      </p>
      <div role="status">{status}</div>
      <div className="ng-symbols-grid">
        {assets
          .filter(
            (a) =>
              a.category === category &&
              a.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          )
          .map((asset) => (
            <button
              type="button"
              key={asset.id}
              title={asset.name}
              onClick={() => insert(asset)}
            >
              <img src={asset.dataURL} alt="" />
              <span>{asset.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
};
