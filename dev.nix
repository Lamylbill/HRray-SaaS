{ pkgs }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20,
    pkgs.nodePackages.vite,
    pkgs.nodePackages.npm,
  ];
}