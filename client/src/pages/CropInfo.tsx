import { useQuery } from "@tanstack/react-query";
import type { CropInfo as CropInfoType } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CropInfo() {
  const [search, setSearch] = useState("");

  const { data: cropInfoList, isLoading } = useQuery<CropInfoType[]>({
    queryKey: ["/api/crop-info", { search }],
  });

  const filteredInfo = cropInfoList || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-accent text-accent-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-accent-foreground hover:bg-accent/80" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Crop Information</h1>
            <p className="text-accent-foreground/80">Learn about different crops and farming</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search crop information..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-crop-info"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading information...</p>
          </div>
        ) : filteredInfo.length === 0 ? (
          <div className="text-center py-12">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">No crop information available yet</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for educational content about crops and farming!
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInfo.map((info) => (
              <Card key={info.id} data-testid={`card-crop-info-${info.id}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{info.title}</CardTitle>
                  {info.tags && info.tags.length > 0 && (
                    <CardDescription>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {info.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-muted rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {info.mediaUrl && (
                    <img
                      src={info.mediaUrl}
                      alt={info.title}
                      className="w-full h-64 object-cover rounded-lg"
                      data-testid={`img-crop-info-${info.id}`}
                    />
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{info.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
