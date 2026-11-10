import sys,glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+'/s_*.jpg'),key=lambda f:float(f.split('_')[-1][:-4]))
ims=[Image.open(f).resize((640,360)) for f in fs]; cols=4; rows=(len(ims)+cols-1)//cols
sh=Image.new('RGB',(640*cols,360*rows))
for i,im in enumerate(ims): sh.paste(im,((i%cols)*640,(i//cols)*360))
sh.save(d+'/sheet.jpg',quality=80)
