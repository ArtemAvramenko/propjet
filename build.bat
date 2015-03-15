@echo off
cd /d %~dp0
if "%ProgramFiles(x86)%" == "" set ProgramFiles(x86)=%ProgramFiles%
"%ProgramFiles(x86)%\MSBuild\12.0\Bin\MSBuild.exe" msbuild.proj
