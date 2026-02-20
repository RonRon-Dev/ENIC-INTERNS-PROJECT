{
  description = "C# development environment with ASP.NET SDK and nodejs";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs, }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.x86_64-linux.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          dotnet-sdk_10
          nodejs_24
          omnisharp-roslyn
          # vimPlugins.omnisharp-extended-lsp-nvim
          # csharp-ls
          csharpier
          openssl
          zlib
          icu
        ];
        shellHook = ''
          echo "Welcome to the C# development environment with ASP.NET SDK and nodejs and npm!"
          echo "dotnet --version: $(dotnet --version)"
          echo "node --version: $(node --version)"
        '';
      };
    };
}
