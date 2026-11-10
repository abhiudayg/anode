class Anode < Formula
  desc "Deploy unmodified Go backends to Linux VPS without Docker or Kubernetes"
  homepage "https://github.com/abhiudayg/anode"
  url "https://github.com/abhiudayg/anode/archive/refs/tags/v1.0.0.tar.gz"
  version "1.0.0"
  license "MIT"
  head "https://github.com/abhiudayg/anode.git", branch: "master"

  depends_on "go" => :build

  def install
    system "go", "build", *std_go_args(ldflags: "-s -w -X main.Version=#{version}"), "./cmd/anode"
  end

  test do
    output = shell_output("#{bin}/anode version")
    assert_match "anode version", output
  end
end
