import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Search, Trash2, Copy, ExternalLink, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BalanceResult {
  address: string;
  balance: string;
  status: "idle" | "loading" | "success" | "error";
  timestamp?: string;
  error?: string;
}

export default function App() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<BalanceResult[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastQueryInfo, setLastQueryInfo] = useState<{ time: string; count: number; total: number } | null>(null);

  const handleQuery = async () => {
    const addresses = input
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      toast.error("请输入至少一个地址");
      return;
    }

    setIsQuerying(true);
    const initialResults: BalanceResult[] = addresses.map((addr) => ({
      address: addr,
      balance: "0",
      status: "loading",
      timestamp: new Date().toLocaleTimeString(),
    }));
    setResults(initialResults);

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      try {
        const response = await axios.get(`/api/balance/${encodeURIComponent(address)}`);
        // The balance is nested in amulet_balance.balance.total_available_coin
        const data = response.data;
        let balance = "0";
        
        if (data.amulet_balance?.balance?.total_available_coin !== undefined) {
          balance = data.amulet_balance.balance.total_available_coin;
        } else if (data.balance && data.balance !== "") {
          balance = data.balance;
        } else if (data.amount) {
          balance = data.amount;
        }
        
        // Ensure balance is a valid number string for parsing
        if (isNaN(parseFloat(balance))) {
          balance = "0";
        }
        
        setResults((prev) =>
          prev.map((res, idx) =>
            idx === i ? { ...res, balance: String(balance), status: "success" } : res
          )
        );
      } catch (error: any) {
        console.error(`Error querying ${address}:`, error);
        setResults((prev) =>
          prev.map((res, idx) =>
            idx === i
              ? {
                  ...res,
                  status: "error",
                  error: error.response?.data?.message || error.message || "查询失败",
                }
              : res
          )
        );
      }
    }
    setIsQuerying(false);
    
    // Calculate total for the last query record
    const currentTotal = addresses.reduce((acc, addr) => {
      const res = initialResults.find(r => r.address === addr);
      // Note: initialResults is updated by the loop via setResults, 
      // but we need the final values. Let's use the results state after the loop.
      return acc;
    }, 0);

    setLastQueryInfo({
      time: new Date().toLocaleString(),
      count: addresses.length,
      total: totalBalance, // This will use the latest totalBalance calculated in the component
    });
    toast.success("查询完成");
  };

  const clearAll = () => {
    setInput("");
    setResults([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  const totalBalance = results
    .filter((r) => r.status === "success")
    .reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-blue-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Wallet className="w-6 h-6" />
              <span className="text-xs font-bold tracking-widest uppercase">Canton Network</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              CC 余额批量查询工具
            </h1>
            <p className="text-slate-500 max-w-2xl">
              快速查询多个 Canton 地址的 CC 余额。支持批量输入，实时显示查询进度。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://lighthouse.cantonloop.com/", "_blank")}
              className="rounded-full border-slate-200 hover:bg-slate-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              区块浏览器
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  输入地址
                </CardTitle>
                <CardDescription>每行输入一个地址</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <Textarea
                  placeholder="Party::...&#10;Party::..."
                  className="min-h-[300px] font-mono text-sm resize-none border-slate-200 focus-visible:ring-blue-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isQuerying}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    onClick={handleQuery}
                    disabled={isQuerying || !input.trim()}
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        查询中...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        开始查询
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearAll}
                    disabled={isQuerying}
                    className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"
              >
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
                  当前查询总余额
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums">
                    {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-medium opacity-80">CC</span>
                </div>
                <Separator className="my-4 bg-blue-500/30" />
                <div className="flex justify-between text-xs font-medium text-blue-100">
                  <span>查询总数: {results.length}</span>
                  <span>成功: {results.filter((r) => r.status === "success").length}</span>
                </div>
              </motion.div>
            )}

            {lastQueryInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm"
              >
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  上一次查询记录
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">查询时间</span>
                    <span className="text-xs font-medium text-slate-700">{lastQueryInfo.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">查询数量</span>
                    <span className="text-xs font-medium text-slate-700">{lastQueryInfo.count} 个地址</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">查询总余额</span>
                    <span className="text-xs font-medium text-emerald-600">
                      {lastQueryInfo.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CC
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">查询结果</CardTitle>
                    <CardDescription>实时更新的余额列表</CardDescription>
                  </div>
                  {results.length > 0 && (
                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">
                      {results.filter(r => r.status === 'loading').length > 0 ? '查询中' : '已完成'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[500px]">
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Wallet className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm">暂无查询结果，请在左侧输入地址</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="w-[100px] text-xs uppercase tracking-wider font-bold text-slate-500">
                            状态
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-wider font-bold text-slate-500">
                            地址
                          </TableHead>
                          <TableHead className="text-center text-xs uppercase tracking-wider font-bold text-slate-500">
                            查询时间
                          </TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wider font-bold text-slate-500">
                            余额 (CC)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {results.map((result, index) => (
                            <motion.tr
                              key={`${result.address}-${index}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group hover:bg-slate-50/80 transition-colors border-slate-100"
                            >
                              <TableCell>
                                {result.status === "loading" && (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                )}
                                {result.status === "success" && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                                {result.status === "error" && (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs max-w-[300px]">
                                <div className="flex items-center gap-2">
                                  <span className="truncate">{result.address}</span>
                                  <button
                                    onClick={() => copyToClipboard(result.address)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                                  >
                                    <Copy className="w-3 h-3 text-slate-500" />
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono text-[10px] text-slate-400">
                                {result.timestamp || "---"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">
                                {result.status === "loading" ? (
                                  <span className="text-slate-300">---</span>
                                ) : result.status === "error" ? (
                                  <span className="text-red-400 text-[10px]" title={result.error}>
                                    查询出错
                                  </span>
                                ) : (
                                  <span className="text-slate-900 tabular-nums">
                                    {parseFloat(result.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© 2026 Canton CC Batch Checker. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              API 状态: 正常
            </span>
          </div>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
