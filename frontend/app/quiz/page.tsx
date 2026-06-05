"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle2, AlertCircle, ChevronRight, RefreshCw, Terminal, Check, X, HelpCircle, Code2, Clock, ShieldCheck, Sparkles } from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface QuizResult {
  score: number
  total: number
  percentage: number
  ai_analysis: string
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/quiz/loops")
        if (!res.ok) throw new Error("Failed to fetch questions")
        const data = await res.json()
        setQuestions(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load questions:", error)
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06070a] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#00ff87] drop-shadow-[0_0_15px_#00ff87]" />
        <p className="text-xs tracking-[0.2em] uppercase font-mono text-emerald-400 mt-5 animate-pulse">Setting Up Interview Environment...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06070a] text-white px-4">
        <div className="p-6 bg-[#0d0f16] border border-red-500/20 rounded-2xl max-w-md text-center shadow-[0_0_40px_rgba(239,68,68,0.05)]">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-red-400">FastAPI Connection Refused</h3>
          <p className="text-xs text-gray-500 mt-2 font-sans leading-relaxed">Could not establish handshake with the python backend. Verify your uvicorn instance is active.</p>
          <Button onClick={() => window.location.reload()} className="mt-5 bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-400 font-mono text-xs uppercase tracking-widest h-9">
            <RefreshCw className="mr-2 h-3 w-3" /> Reconnect
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIdx]
  const progressValue = ((currentIdx + 1) / questions.length) * 100

  const renderQuestionTitle = (rawQuestion: string) => {
    const codeKeywords = ["for i in", "while ", "def ", "import ", "print("]
    const hasCode = codeKeywords.some(keyword => rawQuestion.includes(keyword))

    if (hasCode) {
      const separatorIdx = rawQuestion.indexOf("for ") !== -1 
        ? rawQuestion.indexOf("for ") 
        : rawQuestion.indexOf("while ") !== -1 
          ? rawQuestion.indexOf("while ") 
          : rawQuestion.indexOf("print(")

      if (separatorIdx !== -1) {
        const textPart = rawQuestion.substring(0, separatorIdx).trim()
        let codePart = rawQuestion.substring(separatorIdx).trim()

        if (codePart.includes("?:")) codePart = codePart.replace("?:", "?\n:")
        codePart = codePart.replace("): ", "):\n    ")

        return (
          <div className="space-y-5">
            <span className="text-[17px] font-medium tracking-wide leading-relaxed text-gray-200 block">{textPart}</span>
            
            <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-[#0a0b10] shadow-[inset_0_1px_12px_rgba(0,0,0,0.6)]">
              <div className="bg-[#0e1017] px-4 py-2.5 border-b border-gray-900 flex items-center justify-between select-none">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  <Code2 className="h-3 w-3 text-emerald-500/70" /> main.py
                </span>
              </div>
              <pre className="p-5 font-mono text-[14px] text-emerald-400 overflow-x-auto leading-relaxed">
                <code>{codePart}</code>
              </pre>
            </div>
          </div>
        )
      }
    }

    return <span className="text-lg font-medium tracking-wide leading-relaxed text-gray-200">{rawQuestion}</span>
  }

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return
    setSelectedAnswer(option)
    setIsAnswered(true)
    setAnswers({ ...answers, [currentQuestion.id]: option })
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      const previousSavedAnswer = answers[questions[nextIdx].id] || ""
      setSelectedAnswer(previousSavedAnswer)
      setIsAnswered(previousSavedAnswer !== "")
    }
  }

  const handlePrevious = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1
      setCurrentIdx(prevIdx)
      setSelectedAnswer(answers[questions[prevIdx].id] || "")
      setIsAnswered(true)
    }
  }

  const handleSubmitQuiz = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "loops",
          answers: answers,
        }),
      })
      if (!response.ok) throw new Error("Submission failed")
      const resultData = await response.json()
      setResult(resultData)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Submission failed:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06070a] text-white relative font-sans overflow-x-hidden selection:bg-[#00ff87]/20">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-[-25%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/[0.03] blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] bg-purple-500/[0.03] blur-[130px] rounded-full pointer-events-none" />

      <header className="border-b border-gray-900 bg-[#06070a]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gray-400">
              Python Technical Interview Test
            </h2>
          </div>
          <h1 className="text-xs font-mono tracking-[0.3em] font-black text-[#00ff87] uppercase drop-shadow-[0_0_10px_rgba(0,255,135,0.4)]">
            PYQUIZ.PRO
          </h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto py-12 px-4 flex flex-col justify-center min-h-[calc(screen-90px)]">
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0e1017] border border-gray-900 rounded-xl p-3 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Format</span>
              <span className="text-xs font-medium text-gray-300">Untimed Session</span>
            </div>
          </div>
          <div className="bg-[#0e1017] border border-gray-900 rounded-xl p-3 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Validation</span>
              <span className="text-xs font-medium text-gray-300">Instant Verification</span>
            </div>
          </div>
          <div className="bg-[#0e1017] border border-gray-900 rounded-xl p-3 flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Focus Target</span>
              <span className="text-xs font-medium text-gray-300">Control Flows</span>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[11px] tracking-wider uppercase text-gray-500">
              Evaluation Stack Index
            </span>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>
          <Progress value={progressValue} className="h-[3px] bg-gray-900 overflow-hidden" />
        </div>

        <Card className="bg-[#0b0c11] border border-gray-800/60 shadow-[0_30px_70px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden transition-all duration-300">
          <CardHeader className="border-b border-gray-900 p-6 sm:p-8 bg-[#0f1118]/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest mb-2.5">
              <Terminal className="h-3.5 w-3.5 text-[#00ff87]" /> Question Prompt
            </div>
            <CardTitle className="p-0">
              {renderQuestionTitle(currentQuestion.question)}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8 bg-[#0b0c11] space-y-5">
            <RadioGroup
              value={selectedAnswer}
              className="grid gap-3"
              disabled={isAnswered}
            >
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedAnswer === option
                const isCorrectOption = option === currentQuestion.correct_answer
                
                let cardStyle = "border-gray-900 bg-[#10121a]/60 hover:border-gray-800 hover:bg-[#131622]/90"
                let labelStyle = "text-gray-400"
                let radioColorClass = "[&_button]:border-gray-800"
                let iconComponent = null

                if (isAnswered) {
                  if (isSelected) {
                    if (isCorrectOption) {
                      cardStyle = "border-green-500 bg-green-500/[0.03] shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                      labelStyle = "text-green-400 font-semibold"
                      radioColorClass = "[&_button]:border-green-500 [&_button]:text-green-500 [&_button_span]:bg-green-500"
                      iconComponent = <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20"><Check className="h-3 w-3 text-green-400" /></div>
                    } else {
                      cardStyle = "border-red-500 bg-red-500/[0.03] shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                      labelStyle = "text-red-400 font-semibold"
                      radioColorClass = "[&_button]:border-red-500 [&_button]:text-red-500 [&_button_span]:bg-red-500"
                      iconComponent = <div className="h-5 w-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><X className="h-3 w-3 text-red-400" /></div>
                    }
                  } else if (isCorrectOption) {
                    cardStyle = "border-green-500/50 bg-green-500/[0.01]"
                    labelStyle = "text-green-400/80 font-medium"
                    radioColorClass = "[&_button]:border-green-500/50"
                  } else {
                    cardStyle = "border-gray-950 bg-[#10121a]/20 opacity-20 select-none pointer-events-none"
                  }
                } else if (isSelected) {
                  cardStyle = "border-[#00ff87] bg-[#00ff87]/[0.01] shadow-[0_0_15px_rgba(0,255,135,0.05)]"
                  labelStyle = "text-[#00ff87] font-medium"
                  radioColorClass = "[&_button]:border-[#00ff87]"
                }

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200 ${cardStyle} ${!isAnswered ? "cursor-pointer active:scale-[0.995]" : "cursor-default"}`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="flex items-center space-x-3.5 flex-1">
                      <div className={radioColorClass}>
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${i}`} 
                          disabled={isAnswered}
                          className="focus:ring-0 focus:ring-offset-0 transition-all duration-200"
                        />
                      </div>
                      <Label 
                        htmlFor={`option-${i}`} 
                        className={`w-full font-normal text-[14.5px] tracking-wide leading-relaxed transition-colors duration-150 ${labelStyle} ${!isAnswered ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {option}
                      </Label>
                    </div>
                    {iconComponent}
                  </div>
                )
              })}
            </RadioGroup>

            {isAnswered && currentQuestion.explanation && (
              <div className="mt-6 p-5 bg-[#0f1119] border-l-2 border-[#00ff87] rounded-r-xl space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.01)]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 uppercase tracking-widest">
                  <HelpCircle className="h-3.5 w-3.5 text-[#00ff87]" /> Technical Breakdown
                </div>
                <p className="text-[13.5px] text-gray-400 leading-relaxed font-sans antialiased">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-gray-900 p-6 bg-[#0f1118]/40">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentIdx === 0}
              className="font-mono text-xs uppercase tracking-widest text-gray-500 hover:text-white hover:bg-gray-900 h-9 px-4 disabled:opacity-20"
            >
              Prev
            </Button>

            {currentIdx === questions.length - 1 ? (
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={!isAnswered || submitting}
                className="bg-[#00ff87] hover:bg-[#00e074] text-[#050608] font-mono text-xs font-bold uppercase tracking-widest px-6 shadow-[0_4px_25px_rgba(0,255,135,0.2)] rounded-lg h-9.5 disabled:opacity-40"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Compiling Matrix</>
                ) : (
                  "Submit Intelligence"
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={!isAnswered}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-mono text-xs uppercase tracking-widest px-5 rounded-lg h-9.5 disabled:opacity-40"
              >
                Next Node <ChevronRight className="ml-1 h-3.5 w-3.5 text-[#00ff87]" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-[#090a0f] border border-gray-900 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] text-white p-6">
          <DialogHeader className="flex flex-col items-center text-center border-b border-gray-900 pb-5">
            <div className="h-13 w-13 rounded-full bg-[#00ff87]/5 border border-[#00ff87]/20 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,255,135,0.05)]">
              <CheckCircle2 className="h-6 w-6 text-[#00ff87]" />
            </div>
            <DialogTitle className="text-lg font-mono uppercase tracking-wider font-bold">Interview Metrics Compiled</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-mono mt-1">
              Final Index Rate: <span className="text-[#00ff87] font-bold text-sm">{result?.score} / {result?.total}</span> ({result?.percentage}%)
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#0d0f16] border border-gray-900 rounded-xl p-5 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-gray-500 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-ping" /> AI Recruiter Feedback
            </h4>
            <p className="text-[13.5px] leading-relaxed text-gray-400 whitespace-pre-wrap font-sans">
              {result?.ai_analysis}
            </p>
          </div>

          <div className="flex gap-3 mt-6 justify-end font-mono text-xs">
            <Button variant="outline" onClick={() => window.location.reload()} className="border-gray-900 bg-transparent text-gray-500 hover:text-white hover:bg-gray-900 uppercase tracking-widest h-9.5">
              Reset Session
            </Button>
            <Button onClick={() => setIsDialogOpen(false)} className="bg-[#00ff87] text-[#050608] font-bold hover:bg-[#00e074] uppercase tracking-widest h-9.5">
              Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// "use client"

// import React, { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Label } from "@/components/ui/label"
// import { Progress } from "@/components/ui/progress"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Loader2, CheckCircle2, AlertCircle, ChevronRight, RefreshCw, Terminal, Check, X, HelpCircle } from "lucide-react"

// interface Question {
//   id: string
//   question: string
//   options: string[]
//   correct_answer: string
//   explanation: string
// }

// interface QuizResult {
//   score: number
//   total: number
//   percentage: number
//   ai_analysis: string
// }

// export default function QuizPage() {
//   const [questions, setQuestions] = useState<Question[]>([])
//   const [currentIdx, setCurrentIdx] = useState(0)
//   const [selectedAnswer, setSelectedAnswer] = useState<string>("")
//   const [answers, setAnswers] = useState<Record<string, string>>({})
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [result, setResult] = useState<QuizResult | null>(null)
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
  
//   // ট্র্যাক করবে কারেন্ট প্রশ্নে ইউজার অলরেডি সাবমিট/ক্লিক করেছে কি না
//   const [isAnswered, setIsAnswered] = useState(false)

//   useEffect(() => {
//     async function fetchQuestions() {
//       try {
//         const res = await fetch("http://127.0.0.1:8000/api/quiz/loops")
//         if (!res.ok) throw new Error("Failed to fetch questions")
//         const data = await res.json()
//         setQuestions(data)
//         setLoading(false)
//       } catch (error) {
//         console.error("Failed to load questions:", error)
//         setLoading(false)
//       }
//     }
//     fetchQuestions()
//   }, [])

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-[#090a0f] text-white">
//         <Loader2 className="h-10 w-10 animate-spin text-[#00ff87] drop-shadow-[0_0_10px_#00ff87]" />
//         <p className="text-sm tracking-widest uppercase font-mono text-gray-400 mt-4 animate-pulse">Initializing AI Assessment...</p>
//       </div>
//     )
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-[#090a0f] text-white px-4">
//         <div className="p-6 bg-[#12141c] border border-red-500/30 rounded-xl max-w-md text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
//           <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-red-400">Connection Failed</h3>
//           <p className="text-sm text-gray-400 mt-2 font-sans">Unable to connect to the FastAPI Core. Please make sure your Python server is running on port 8000.</p>
//           <Button onClick={() => window.location.reload()} className="mt-5 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-400 font-mono text-xs uppercase tracking-widest">
//             <RefreshCw className="mr-2 h-3 w-3" /> Retry Connection
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   const currentQuestion = questions[currentIdx]
//   const progressValue = ((currentIdx + 1) / questions.length) * 100

//   // অপশন ক্লিক হ্যান্ডলার (ইনস্ট্যান্ট চেক করবে)
//   const handleOptionSelect = (option: string) => {
//     if (isAnswered) return // একবার উত্তর দিলে আর চেঞ্জ করা যাবে না
    
//     setSelectedAnswer(option)
//     setIsAnswered(true)
//     setAnswers({ ...answers, [currentQuestion.id]: option })
//   }

//   const handleNext = () => {
//     if (currentIdx < questions.length - 1) {
//       const nextIdx = currentIdx + 1
//       setCurrentIdx(nextIdx)
      
//       // পরবর্তী প্রশ্নের উত্তর আগে দেওয়া থাকলে সেট করবে, না থাকলে রিসেট করবে
//       const previousSavedAnswer = answers[questions[nextIdx].id] || ""
//       setSelectedAnswer(previousSavedAnswer)
//       setIsAnswered(previousSavedAnswer !== "")
//     }
//   }

//   const handlePrevious = () => {
//     if (currentIdx > 0) {
//       const prevIdx = currentIdx - 1
//       setCurrentIdx(prevIdx)
//       setSelectedAnswer(answers[questions[prevIdx].id] || "")
//       setIsAnswered(true) // আগের প্রশ্নে যেহেতু অলরেডি উত্তর দেওয়া হয়েছে
//     }
//   }

//   const handleSubmitQuiz = async () => {
//     setSubmitting(true)
//     try {
//       const response = await fetch("http://127.0.0.1:8000/api/quiz/submit", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           topic: "loops",
//           answers: answers,
//         }),
//       })
//       if (!response.ok) throw new Error("Submission failed")
//       const resultData = await response.json()
//       setResult(resultData)
//       setIsDialogOpen(true)
//     } catch (error) {
//       console.error("Submission failed:", error)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-[#090a0f] text-white relative font-sans overflow-x-hidden selection:bg-[#00ff87]/30">
//       {/* Background Cyber-Grid Effect */}
//       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
//       <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00ff87]/5 blur-[120px] rounded-full pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

//       {/* Top Navbar Branding */}
//       <header className="border-b border-gray-800/40 bg-[#090a0f]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
//         <div className="max-w-4xl mx-auto flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <span className="text-xs font-mono bg-emerald-500/10 text-[#00ff87] border border-[#00ff87]/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">AI Powered</span>
//             <span className="text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Python</span>
//           </div>
//           <h1 className="text-sm font-mono tracking-[0.25em] font-black text-[#00ff87] uppercase drop-shadow-[0_0_8px_rgba(0,255,135,0.3)]">
//             PYQUIZ.AI
//           </h1>
//         </div>
//       </header>

//       <div className="container max-w-2xl mx-auto py-12 px-4 flex flex-col justify-center min-h-[calc(screen-80px)]">
//         {/* Step Indicator & Progress */}
//         <div className="mb-8 space-y-3">
//           <div className="flex justify-between items-end">
//             <span className="font-mono text-xs tracking-wider uppercase text-gray-500">
//               <span className="text-[#00ff87] font-bold">03 /</span> Questions
//             </span>
//             <span className="font-mono text-xs text-gray-400 bg-[#12141c] border border-gray-800 px-2 py-1 rounded">
//               {currentIdx + 1} of {questions.length}
//             </span>
//           </div>
//           <Progress 
//             value={progressValue} 
//             className="h-1 bg-gray-800 overflow-hidden" 
//             style={{ 
//               ['--progress-background' as any]: '#00ff87',
//               boxShadow: '0 0 10px rgba(0, 255, 135, 0.2)' 
//             }}
//           />
//         </div>

//         {/* Core Quiz Module Panel */}
//         <Card className="bg-[#12141c] border border-gray-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
//           <CardHeader className="border-b border-gray-800/50 p-6 sm:p-8 bg-[#151822]">
//             <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
//               <Terminal className="h-3.5 w-3.5 text-[#00ff87]" /> Question Prompt
//             </div>
//             <CardTitle className="text-lg sm:text-xl font-medium tracking-wide leading-relaxed text-gray-100">
//               {currentQuestion.question}
//             </CardTitle>
//           </CardHeader>
          
//           <CardContent className="p-6 sm:p-8 bg-[#12141c] space-y-6">
//             <RadioGroup
//               value={selectedAnswer}
//               className="grid gap-3.5"
//               disabled={isAnswered}
//             >
//               {currentQuestion.options.map((option, i) => {
//                 const isSelected = selectedAnswer === option
//                 const isCorrectOption = option === currentQuestion.correct_answer
                
//                 // ডাইনামিক স্টাইল ভ্যারিয়েবলস (গ্রিন ও রেড মার্কিং লজিক)
//                 let cardStyle = "border-gray-800/80 bg-[#161924] hover:border-gray-700 hover:bg-[#1b1e2b]"
//                 let labelStyle = "text-gray-300"
//                 let iconComponent = null

//                 if (isAnswered) {
//                   if (isSelected) {
//                     if (isCorrectOption) {
//                       // যদি সিলেক্ট করা উত্তর সঠিক হয় -> ফুল গ্রিন
//                       cardStyle = "border-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
//                       labelStyle = "text-green-400 font-medium"
//                       iconComponent = <Check className="h-4 w-4 text-green-400 ml-auto" />
//                     } else {
//                       // যদি সিলেক্ট করা উত্তর ভুল হয় -> ফুল রেড
//                       cardStyle = "border-red-500 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
//                       labelStyle = "text-red-400 font-medium"
//                       iconComponent = <X className="h-4 w-4 text-red-400 ml-auto" />
//                     }
//                   } else if (isCorrectOption) {
//                     // ভুল সিলেক্ট করার পর আসল সঠিক উত্তরটি হাইলাইট হবে
//                     cardStyle = "border-green-500/60 bg-transparent dashboard-correct-glow"
//                     labelStyle = "text-green-400/90 font-medium"
//                   } else {
//                     cardStyle = "border-gray-800/40 bg-[#161924]/50 opacity-40"
//                   }
//                 } else if (isSelected) {
//                   cardStyle = "border-[#00ff87] bg-[#00ff87]/[0.02]"
//                   labelStyle = "text-[#00ff87]"
//                 }

//                 return (
//                   <div
//                     key={i}
//                     className={`flex items-center space-x-3 rounded-xl border p-4.5 transition-all duration-200 ${cardStyle} ${!isAnswered ? "cursor-pointer" : "cursor-default"}`}
//                     onClick={() => handleOptionSelect(option)}
//                   >
//                     <RadioGroupItem 
//                       value={option} 
//                       id={`option-${i}`} 
//                       disabled={isAnswered}
//                       className={`border-gray-700 text-[#00ff87] focus:ring-0 ${
//                         isAnswered && isCorrectOption ? "border-green-500 text-green-500" : ""
//                       } ${isAnswered && isSelected && !isCorrectOption ? "border-red-500 text-red-500" : ""}`}
//                     />
//                     <Label 
//                       htmlFor={`option-${i}`} 
//                       className={`w-full font-normal text-[15px] leading-relaxed transition-colors duration-150 ${labelStyle} ${!isAnswered ? "cursor-pointer" : "cursor-default"}`}
//                     >
//                       {option}
//                     </Label>
//                     {iconComponent}
//                   </div>
//                 )
//               })}
//             </RadioGroup>

//             {/* ইন্টেলিজেন্ট এক্সপ্লেনেশন সেকশন (উত্তর দেওয়ার পর ওপেন হবে) */}
//             {isAnswered && currentQuestion.explanation && (
//               <div className="mt-5 p-5 bg-[#171a26] border-l-2 border-[#00ff87] rounded-r-xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
//                 <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 uppercase tracking-widest">
//                   <HelpCircle className="h-3.5 w-3.5 text-[#00ff87]" /> Explanation
//                 </div>
//                 <p className="text-sm text-gray-300 leading-relaxed font-sans">
//                   {currentQuestion.explanation}
//                 </p>
//               </div>
//             )}
//           </CardContent>

//           <CardFooter className="flex justify-between border-t border-gray-800/50 p-6 bg-[#151822]/60">
//             <Button
//               variant="ghost"
//               onClick={handlePrevious}
//               disabled={currentIdx === 0}
//               className="font-mono text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
//             >
//               Back
//             </Button>

//             {currentIdx === questions.length - 1 ? (
//               <Button 
//                 onClick={handleSubmitQuiz} 
//                 disabled={!isAnswered || submitting}
//                 className="bg-[#00ff87] hover:bg-[#00e074] text-[#050608] font-mono text-xs font-bold uppercase tracking-widest px-6 shadow-[0_4px_20px_rgba(0,255,135,0.25)] rounded-lg transition-all h-10 disabled:opacity-40"
//               >
//                 {submitting ? (
//                   <>
//                     <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
//                     Analyzing
//                   </>
//                 ) : (
//                   "Finish Assessment"
//                 )}
//               </Button>
//             ) : (
//               <Button 
//                 onClick={handleNext} 
//                 disabled={!isAnswered}
//                 className="bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-widest px-5 rounded-lg transition-all h-10 disabled:opacity-40"
//               >
//                 Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
//               </Button>
//             )}
//           </CardFooter>
//         </Card>
//       </div>

//       {/* Final Scoring Analytics Modal */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-xl bg-[#0d0f16] border border-gray-800 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] text-white sm:rounded-2xl p-6">
//           <DialogHeader className="flex flex-col items-center text-center border-b border-gray-800 pb-5">
//             <div className="h-14 w-14 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,255,135,0.1)]">
//               <CheckCircle2 className="h-7 w-7 text-[#00ff87]" />
//             </div>
//             <DialogTitle className="text-xl font-mono uppercase tracking-wider font-bold">Assessment Metrics</DialogTitle>
//             <DialogDescription className="text-sm text-gray-400 font-mono mt-1">
//               Performance Index: <span className="text-[#00ff87] font-bold text-base">{result?.score} / {result?.total}</span> ({result?.percentage}%)
//             </DialogDescription>
//           </DialogHeader>

//           {/* Gemini AI Detailed Markdown Analysis Output */}
//           <div className="bg-[#12141c] border border-gray-800/80 rounded-xl p-5 mt-4 max-h-[320px] overflow-y-auto custom-scrollbar">
//             <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-gray-500 mb-3 flex items-center gap-1.5">
//               <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-ping" /> AI Mentor Intelligence
//             </h4>
//             <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap font-sans font-normal antialiased">
//               {result?.ai_analysis}
//             </p>
//           </div>

//           <div className="flex gap-3 mt-6 justify-end font-mono text-xs">
//             <Button variant="outline" onClick={() => window.location.reload()} className="border-gray-800 bg-transparent text-gray-400 hover:text-white hover:bg-gray-800 uppercase tracking-widest">
//               Re-take
//             </Button>
//             <Button onClick={() => setIsDialogOpen(false)} className="bg-[#00ff87] text-[#050608] font-bold hover:bg-[#00e074] uppercase tracking-widest">
//               Dismiss
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }



// "use client"

// import React, { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Label } from "@/components/ui/label"
// import { Progress } from "@/components/ui/progress"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

// interface Question {
//   id: string
//   question: string
//   options: string[]
//   correct_answer: string
//   explanation: string
// }

// interface QuizResult {
//   score: number
//   total: number
//   percentage: number
//   ai_analysis: string
// }

// export default function QuizPage() {
//   const [questions, setQuestions] = useState<Question[]>([])
//   const [currentIdx, setCurrentIdx] = useState(0)
//   const [selectedAnswer, setSelectedAnswer] = useState<string>("")
//   const [answers, setAnswers] = useState<Record<string, string>>({})
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [result, setResult] = useState<QuizResult | null>(null)
//   const [isDialogOpen, setIsDialogOpen] = useState(false)

//   useEffect(() => {
//     async function fetchQuestions() {
//       try {
//         const res = await fetch("http://127.0.0.1:8000/api/quiz/loops")
//         if (!res.ok) {
//           throw new Error("Failed to fetch questions")
//         }
//         const data = await res.json()
//         setQuestions(data)
//         setLoading(false)
//       } catch (error) {
//         console.error("Failed to load questions:", error)
//         setLoading(false)
//       }
//     }
//     fetchQuestions()
//   }, [])

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen gap-2">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading Quiz Questions...</p>
//       </div>
//     )
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen gap-2">
//         <AlertCircle className="h-8 w-8 text-destructive" />
//         <p className="text-sm font-medium">No questions found. Please check if backend server is running.</p>
//       </div>
//     )
//   }

//   const currentQuestion = questions[currentIdx]
//   const progressValue = ((currentIdx + 1) / questions.length) * 100

//   const handleNext = () => {
//     if (!selectedAnswer) return
//     const updatedAnswers = { ...answers, [currentQuestion.id]: selectedAnswer }
//     setAnswers(updatedAnswers)
//     if (currentIdx < questions.length - 1) {
//       setCurrentIdx(currentIdx + 1)
//       setSelectedAnswer(updatedAnswers[questions[currentIdx + 1]?.id] || "")
//     }
//   }

//   const handlePrevious = () => {
//     if (currentIdx > 0) {
//       setCurrentIdx(currentIdx - 1)
//       setSelectedAnswer(answers[questions[currentIdx - 1].id] || "")
//     }
//   }

//   const handleSubmitQuiz = async () => {
//     if (!selectedAnswer) return
//     const finalAnswers = { ...answers, [currentQuestion.id]: selectedAnswer }
//     setAnswers(finalAnswers)

//     setSubmitting(true)
//     try {
//       const response = await fetch("http://127.0.0.1:8000/api/quiz/submit", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           topic: "loops",
//           answers: finalAnswers,
//         }),
//       })
      
//       if (!response.ok) {
//         throw new Error("Submission failed")
//       }
      
//       const resultData = await response.json()
//       setResult(resultData)
//       setIsDialogOpen(true)
//     } catch (error) {
//       console.error("Submission failed:", error)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className="container max-w-3xl mx-auto py-10 px-4 min-h-screen flex flex-col justify-center">
//       <div className="mb-6 space-y-2">
//         <div className="flex justify-between text-sm font-medium text-muted-foreground">
//           <span>Question {currentIdx + 1} of {questions.length}</span>
//           <span>{Math.round(progressValue)}% Completed</span>
//         </div>
//         <Progress value={progressValue} className="h-2" />
//       </div>

//       <Card className="shadow-lg border-muted/60">
//         <CardHeader>
//           <CardTitle className="text-xl font-semibold leading-relaxed">
//             {currentQuestion.question}
//           </CardTitle>
//           <CardDescription>Select the best matching option below.</CardDescription>
//         </CardHeader>
        
//         <CardContent>
//           <RadioGroup
//             value={selectedAnswer}
//             onValueChange={setSelectedAnswer}
//             className="grid gap-3"
//           >
//             {currentQuestion.options.map((option, i) => (
//               <div
//                 key={i}
//                 className={`flex items-center space-x-3 space-y-0 rounded-lg border p-4 transition-all hover:bg-accent cursor-pointer ${
//                   selectedAnswer === option ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
//                 }`}
//                 onClick={() => setSelectedAnswer(option)}
//               >
//                 <RadioGroupItem value={option} id={`option-${i}`} />
//                 <Label htmlFor={`option-${i}`} className="w-full font-normal text-base cursor-pointer">
//                   {option}
//                 </Label>
//               </div>
//             ))}
//           </RadioGroup>
//         </CardContent>

//         <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
//           <Button
//             variant="outline"
//             onClick={handlePrevious}
//             disabled={currentIdx === 0}
//           >
//             Previous
//           </Button>

//           {currentIdx === questions.length - 1 ? (
//             <Button 
//               onClick={handleSubmitQuiz} 
//               disabled={!selectedAnswer || submitting}
//               className="bg-primary text-primary-foreground font-medium"
//             >
//               {submitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Analyzing...
//                 </>
//               ) : (
//                 "Submit Quiz"
//               )}
//             </Button>
//           ) : (
//             <Button onClick={handleNext} disabled={!selectedAnswer}>
//               Next Question
//             </Button>
//           )}
//         </CardFooter>
//       </Card>

//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent className="max-w-xl sm:rounded-xl">
//           <DialogHeader className="flex flex-col items-center text-center">
//             <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
//             <DialogTitle className="text-2xl font-bold tracking-tight">Quiz Performance Analytics</DialogTitle>
//             <DialogDescription className="text-base font-semibold text-foreground pt-1">
//               Your Score: <span className="text-primary text-lg">{result?.score}/{result?.total}</span> ({result?.percentage}%)
//             </DialogDescription>
//           </DialogHeader>

//           <div className="bg-muted/40 rounded-lg p-5 mt-2 border border-muted/60 max-h-[350px] overflow-y-auto">
//             <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">AI Mentor Assessment</h4>
//             <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-normal">
//               {result?.ai_analysis}
//             </p>
//           </div>

//           <div className="flex justify-end gap-3 mt-4">
//             <Button variant="outline" onClick={() => window.location.reload()}>
//               Try Again
//             </Button>
//             <Button onClick={() => setIsDialogOpen(false)}>
//               Close Dashboard
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }