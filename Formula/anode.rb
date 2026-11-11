class Anode < Formula
  desc "Proof-of-Topology Bare-Metal Orchestrator for Unmodified Go Backends"
  homepage "https://anode.abhiudayg.dev"
  version "1.0.0"
  license "MIT"
  head "https://github.com/abhiudayg/anode.git", branch: "master"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/abhiudayg/anode/releases/download/v1.0.0/anode_darwin_arm64.tar.gz"
      sha256 "9cfd7014ead7b68ae17b7e954d0e00225182b1d0b87073e6b9b9aa7e7d3eea99"
    else
      url "https://github.com/abhiudayg/anode/releases/download/v1.0.0/anode_darwin_amd64.tar.gz"
      sha256 "4985da7787e421f8c0c41e87b1110c0c8fc1178c3c19acfb52384d5c9e0bda06"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/abhiudayg/anode/releases/download/v1.0.0/anode_linux_arm64.tar.gz"
      sha256 "3a430fee866db49f1f2de68a2d7796d4ca17dcf59fa95767aaa03c47b743bec7"
    else
      url "https://github.com/abhiudayg/anode/releases/download/v1.0.0/anode_linux_amd64.tar.gz"
      sha256 "951136df56bd3963779849b29ba6a9f677db0adc853ad08743f674cf1164958c"
    end
  end

  head do
    depends_on "go" => :build
  end

  def install
    if build.head?
      system "go", "build", *std_go_args(ldflags: "-s -w -X main.Version=head"), "./cmd/anode"
    else
      bin.install "anode"
    end
  end

  test do
    output = shell_output("#{bin}/anode version")
    assert_match "anode version", output
  end
end
