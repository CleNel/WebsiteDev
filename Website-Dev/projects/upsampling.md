
The goal of this project was to build a complete super-resolution pipeline to transform low-resolution generated images into high-resolution outputs suitable for an art display. The existing system uses a pre-trained diffusion model to generate images, but its output resolution (32×32) is far too small for the display requirements.

To address this, I developed a deep learning-based super-resolution model capable of upscaling images by a factor of 4 — from 32×32 to 128×128. The process involved:

- **Dataset preparation:** Using a dataset of high-resolution image crops, I downsampled them to 32×32 to create paired low- and high-resolution datasets.  
- **Model development:** I designed and implemented a convolutional neural network with upsampling layers, tuned for sharpness and detail preservation.  
- **Loss engineering:** I created a custom perceptual loss combining pixel-wise loss with feature loss extracted from a pretrained VGG19 network.  
- **Training and optimization:** I implemented a robust training pipeline with dataset splitting, validation monitoring using SSIM, learning rate scheduling, and performance tracking.  

Results: The final model successfully upscaled low-resolution inputs to visually rich high-resolution outputs, improving sharpness and preserving structural detail.  

![Upsampling Progress](projects/SSIM_Progress.png)  
![Upsampling Results](projects/super_resolution_results.png)
