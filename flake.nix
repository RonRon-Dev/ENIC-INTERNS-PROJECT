{
  description = "C# development environment with ASP.NET SDK and nodejs";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.x86_64-linux.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          dotnet-sdk_10
          dotnet-ef
          nodejs_25
          omnisharp-roslyn
          csharp-ls
          # vimPlugins.omnisharp-extended-lsp-nvim
          csharpier
          openssl
          sqlcmd
          zlib
          icu

          act
        ];
        shellHook = ''
          echo "Welcome to the C# development environment with ASP.NET SDK and nodejs and npm!"
          echo "dotnet --version: $(dotnet --version)"
          echo "node --version: $(node --version)"
        '';
      };
    };
}
