{ pkgs }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20,
    pkgs.nodePackages.vite,
    pkgs.nodePackages.npm,
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}