import json
import unittest
import wave
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class ProjectTests(unittest.TestCase):
    def test_descriptor(self):
        p = json.loads((ROOT / 'Heliopause.uproject').read_text())
        self.assertEqual(p['EngineAssociation'], '5.4')
        self.assertEqual(p['Modules'][0]['Name'], 'Heliopause')
        self.assertTrue(p['Plugins'][0]['Enabled'])
        for path in ['Source/Heliopause.Target.cs', 'Source/HeliopauseEditor.Target.cs', 'Source/Heliopause/Heliopause.Build.cs']:
            self.assertTrue((ROOT / path).is_file())

    def test_replacement_framework(self):
        core=(ROOT/'Source/Heliopause/Public/HeliopauseCore.h').read_text()
        for name in ['IHPInteractable','UEVASubsystem','ARoomLight','AHandprintDoor','ACurtainWindow','AShipManager','AHeliopauseCharacter','AHeliopauseGameMode']:
            self.assertIn(name,core)
        sources=list((ROOT/'Source/Heliopause/Private').rglob('*.cpp'))
        self.assertEqual(sum(p.read_text().count('IMPLEMENT_PRIMARY_GAME_MODULE') for p in sources),1)
        self.assertFalse((ROOT/'Source/Heliopause/Public/HelioWorld.h').exists())
        story=json.loads((ROOT/'Shared/story.json').read_text())
        for line in story['lines']:
            if line['recording']:
                self.assertTrue((ROOT/f"Content/Audio/Voice/{line['id']}.wav").is_file())
                self.assertTrue((ROOT/f"BrowserPreview/assets/story/{line['id']}.mp3").is_file())

    def test_audio_staged_and_valid(self):
        config = (ROOT / 'Config/DefaultGame.ini').read_text()
        self.assertIn('DirectoriesToAlwaysStageAsNonUFS=(Path="Audio")', config)
        for path in (ROOT / 'Content').rglob('*.wav'):
            with wave.open(str(path)) as f:
                self.assertEqual(f.getsampwidth(), 2)
                self.assertEqual(f.getnchannels(), 1)
                self.assertIn(f.getframerate(), (22050,44100))
                self.assertGreater(f.getnframes(), 0)

    def test_no_network_in_companion(self):
        for path in (ROOT / 'BrowserVoice').glob('*.js'):
            text = path.read_text()
            for forbidden in ['fetch(', 'XMLHttpRequest', 'WebSocket(', 'https://', 'http://']:
                self.assertNotIn(forbidden, text)
        self.assertIn("connect-src 'none'", (ROOT / 'BrowserVoice/index.html').read_text())

    def test_unreal_headers_generated_include_last(self):
        for path in (ROOT / 'Source/Heliopause/Public').glob('*.h'):
            text = path.read_text()
            if 'UCLASS' not in text:
                continue
            includes = [line for line in text.splitlines() if line.startswith('#include')]
            self.assertIn('.generated.h', includes[-1], str(path))

if __name__ == '__main__':
    unittest.main()
