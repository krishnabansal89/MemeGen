"use client"
import { useState, useRef, useEffect } from 'react'
import { Upload, Download, Github, XCircle, Twitter, Loader2 } from 'lucide-react'
import { generateMemeText } from './actions/AzureAction'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import FlickeringGrid from '@/components/ui/flickering-grid'


interface TextElement {
  text: string
  x: number
  y: number
  isDragging: boolean
}

const MemeGenerator = () => {
  const [image, setImage] = useState<string | null>(null)
  const [texts, setTexts] = useState<TextElement[]>([])
  const [inputText, setInputText] = useState('')
  const [selectedText, setSelectedText] = useState<number | null>(null)
  const [isDoubleLine, setIsDoubleLine] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (image && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx?.clearRect(0, 0, 640, 480)
        ctx?.drawImage(img, 0, 0, 640, 480)
        drawTexts()
      }
      img.src = image
    }
  }, [image, texts])

  // ... (keep existing canvas interaction handlers)

  const addText = async () => {
    if (!image) return
    setIsLoading(true)
    try {
      const data = await generateMemeText(image, inputText, isDoubleLine ? "double" : "single")
      if (Array.isArray(data) && data.length > 1 && isDoubleLine) {
        setTexts([
          { text: data[0], x: 100, y: 50, isDragging: false },
          { text: data[1], x: 100, y: 450, isDragging: false }
        ])
      } else {
        setTexts([{ text: data[0], x: 50, y: 50, isDragging: false }])
      }
      setInputText('')
    } catch (error) {
      console.error('Error generating meme text:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const drawTexts = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      texts.forEach(({ text, x, y, isDragging }) => {
        ctx.font = '20px Arial'
        ctx.fillStyle = isDragging ? 'yellow' : 'white'
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 4
        ctx.strokeText(text, x, y)
        ctx.fillText(text, x, y)
      })
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      ctx.strokeText("Generated by @MemeGen", 450, 460)
      ctx.fillText("Generated by @MemeGen", 450, 460)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const compressedImage = await compressImage(file)
      setImage(compressedImage)
    }
  }
  
  
  const saveMeme = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'meme.png'
      link.href = canvasRef.current.toDataURL()
      link.click()
    }
  }
  const resetImage = () => {
    setImage(null)
    setTexts([])
    setInputText('')
  }
  const handleCanvasInteractions = {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      texts.forEach((text, index) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          ctx.font = '40px Arial'
          const metrics = ctx.measureText(text.text)
          if (x >= text.x && x <= text.x + metrics.width && y >= text.y - 40 && y <= text.y) {
            setSelectedText(index)
            dragStartPos.current = { x: x - text.x, y: y - text.y }
            const newTexts = [...texts]
            newTexts[index].isDragging = true
            setTexts(newTexts)
          }
        }
      })
    },
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (selectedText === null || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newTexts = [...texts]
      newTexts[selectedText] = {
        ...newTexts[selectedText],
        x: x - dragStartPos.current.x,
        y: y - dragStartPos.current.y
      }
      setTexts(newTexts)
    },
    onMouseUp: () => {
      if (selectedText !== null) {
        const newTexts = [...texts]
        newTexts[selectedText].isDragging = false
        setTexts(newTexts)
        setSelectedText(null)
      }
    }
  }
  return (
    <div className="min-h-screen  text-white py-8 px-4">
            <FlickeringGrid
        className="-z-40 bg-black lg:h-[120%] absolute inset-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
        
      />

      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Meme Magic
        </h1>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 space-y-6">
            {/* Upload Area / Canvas */}
            <div className="relative w-full aspect-video bg-zinc-800 rounded-lg overflow-hidden">
              {image ? (
                <>
                  <canvas 
                    ref={canvasRef} 
                    width={640}
                    height={480}
                    className="w-full h-full object-contain cursor-move"
                    {...handleCanvasInteractions}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetImage}
                    className="absolute top-2 right-2 text-white hover:text-zinc-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-zinc-700 transition-colors">
                  <Upload className="w-12 h-12 mb-2" />
                  <span className="font-medium">Upload Image</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="meme-type"
                    checked={isDoubleLine}
                    onCheckedChange={setIsDoubleLine}
                  />
                  <Label htmlFor="meme-type" className="text-sm text-white font-bold">
                    Double liner
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addText}
                  disabled={!image || isLoading}
                  className="w-36 hover:cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>

              <div className="flex gap-4">
                <Input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                  placeholder="Add context (optional)"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={saveMeme}
                  disabled={!image}
                  className="flex-1"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Save Meme
                </Button>
                <Button
                  variant="outline"
                
                  className="flex-1 z-10"
                  onClick={()=>{
                    location.assign("https://github.com/krishnabansal89/MemeGen")
                    console.log("clicked")
                  }}
                >
                  <Github className="w-5 h-5 mr-2" onClick={()=>{

                  }}/>
                  Github
                </Button>
              </div>
            </div>

            {/* Attribution */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-zinc-400 text-sm">
              <span>Made by Krishna Bansal</span>
              <a 
                href="https://twitter.com/krishna__bansal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-zinc-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let quality = 0.7
        const compress = () => {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          const sizeInBytes = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4)
          const sizeInKB = sizeInBytes / 1024
          if (sizeInKB > 100 && quality > 0.1) {
            quality -= 0.1
            compress()
          } else {
            resolve(dataUrl)
          }
        }
        compress()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default MemeGenerator

