import { ok } from 'assert'
import fetch from 'cross-fetch'
import { existsSync, readFileSync } from 'fs'
import { asArray, basename, getFileNameFromUrl, isNode, notUndefined, serial } from 'misc-utils-of-mine-generic'
import { imagePixelColor } from '../image/pixel'
import { IFile } from '../types'
import { arrayBufferToBase64, urlToBase64 } from '../util/base64'
import { protectFile } from './protected'
import { ExtractInfoResultImage, imageInfo } from '../image/imageInfo'

export class File implements IFile {
  public content: IFile['content']

  protected isProtected: boolean;

  constructor(public name: string, content: IFile['content'] | ArrayBuffer, isProtected: boolean = false) {
    this.content = content instanceof ArrayBuffer ? new Uint8ClampedArray(content) : content
    this.isProtected = isProtected
    if (this.isProtected) {
      protectFile(this)
    }
  }

  protected _info: ExtractInfoResultImage | undefined;

  /**
   * Get image information, like geometry, important numbers, mimeType, etc. The first time it calls `identify` command, but then it will cache ths value.
   * TODO: make it async
   */
  public info(): Promise<ExtractInfoResultImage> {
    return new Promise(resolve => {
      if (this._info) {
        resolve(this._info)
      } else {
        imageInfo(this).then(data => {
          this._info = data[0].image
          resolve(this._info)
        })
      }
    })
  }

  public async size(): Promise<Size> {
    var i = await this.info()
    return {width: i.geometry?i.geometry.width:0, height: i.geometry?i.geometry.height:0}
  }

  public async mimeType(): Promise<string> {
    var i = await this.info()
    return i.mimeType!
  }

  public pixel(x: number, y: number): Promise<string | undefined> {
    return imagePixelColor(this, x, y)
  }

	/** 
   * Creates a DataUrl like `data:image/png;name=f.png;base64,` using given base64 content, mimeType and fileName. 
  */
  public async asDataUrl(mime?: String) {
    return File.toDataUrl(this, mime)
  }

  /** 
   * Returns base64 representation of this image in an encoded format like PNG  
   */
  public asBase64(file: File) {
    return File.toBase64(file)
  }

	/** 
   * Creates a DataUrl like `data:image/png;name=f.png;base64,` using given base64 content, mimeType and fileName.   
    */
  public static async toDataUrl(file: File, mime?: String) {
    mime = mime || await file.mimeType()
    return 'data:' + mime + ';' + file.name + ';base64,' + File.toBase64(file)
  }

  public static async fromUrl(u: string, o: RequestInit & ResolveOptions = {}) {
    try {
      const r = await fetch(u, o)
      return new File(o.name || o.name || getFileNameFromUrl(u), await r.arrayBuffer())
    } catch (error) {
      console.error(error)
      return undefined
    }
  }

  public static async fromFile(f: string, o: ResolveOptions = {}) {
    if (!isNode()) {
      throw new Error('File.readFile() called in the browser.')
    }
    try {
      return new File(o.name || basename(f), readFileSync(f))
    } catch (error) {
      console.error(error)
      return undefined
    }
  }

  public static toString(f: IFile) {
    return String.fromCharCode.apply(null, f.content as any)
  }

  /** 
   * Returns base64 representation of this image in an ecoded format like PNG 
   */
  public static toBase64(file: File) {
    return arrayBufferToBase64(file.content.buffer)
  }

  /** 
   * Loads file from given base64 string.  
  */
  public static fromBase64(base64: string, name: string) {
    return new File(name, Buffer.from(Base64.decode(base64), 'base64'))
  }

  /** 
   * Loads file from given data url string. 
  */
  public static fromDataUrl(dataUrl: string, name: string) {
    return File.fromBase64(urlToBase64(dataUrl), name)
  }

	/**
	 * Loads files from files in html input element of type "file"
	 */
  public static fromHtmlFileInputElement(el: HTMLInputElement): Promise<Array<File>> {
    return Promise.all(Array.from(el.files!).map(file => new Promise<File>((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener('loadend', e => resolve(new File(file.name, reader.result as ArrayBuffer)));
      reader.readAsArrayBuffer(file);
    })))
  }

  public static async resolve(files: string | IFile | undefined | (string | IFile | undefined)[], options: ResolveOptions = { protected: false }) {
    var fs = (asArray<undefined | string | IFile>(files || [])).filter(notUndefined)
    var result = await serial(fs.map(f => async () => {
      if (typeof f === 'string') {
        if (isNode() && existsSync(f)) {
          return await File.fromFile(f, options)
        }
        else {
          return await File.fromUrl(f, options)
        }
      }
      else {
        ok(ArrayBuffer.isView(f.content))
        return f
      }
    }))
    return result.filter(notUndefined).map(f => File.isFile(f) ? f : new File(f.name, f.content))
  }

  public static isFile(f: any): f is File {
    return f && f.name && f.content && !!(f as File).size
  }

  public static asFile(f: IFile): File {
    return File.isFile(f) ? f : new File(f.name, f.content)
  }

  public static asPath(f: string | IFile) {
    return typeof f === 'string' ? f : f.name
  }
}

export interface ResolveOptions {
  protected?: boolean
  name?: string
}

export interface Size {
  width: number
  height: number
}