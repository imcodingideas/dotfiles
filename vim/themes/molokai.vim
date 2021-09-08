colorscheme molokai
let g:molokai_original = 1

set background=dark
set termguicolors

" if terminal has 256 colors
if !has("gui_running")
  let g:rehash256 = 1
endif

" Better cursor highlighting
hi Search cterm=NONE ctermfg=255 guifg=#eeeeee ctermbg=88 guibg=#870000

