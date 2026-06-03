/**
 * blog controller — extracted from the legacy user.controller monolith.
 * Logic is preserved verbatim; shared dependencies come from shared/context.
 */
const {
  Blog,
  BuilderUser,
  BuildingManager,
  CTRL_DIR,
  CancelLoan,
  Category,
  Disburse,
  DisbursementLoan,
  DocumentSelectedLoan,
  EmployeeMediclaim,
  FamilyMember,
  Inqueryuser,
  LifeInsurance,
  LifeInsuranceDocument,
  LoginLoan,
  Mediclaim,
  MediclaimCompany,
  MediclaimProduct,
  Op,
  PartPaymentLoan,
  PreviousPolicies,
  QueryLoan,
  RunningPolicies,
  SanctionLoan,
  Sequelize,
  Unit,
  UnitCategoryDetail,
  UnitCategoryList,
  User,
  Wing,
  authConfig,
  bcrypt,
  builderConsumer,
  codeDetail,
  companyType,
  consumerRoleMapping,
  createNotification,
  db,
  documents,
  dotenvParseVariables,
  env,
  floor,
  fs,
  fsExtra,
  fsSync,
  hasMeaningfulPreviousPolicyData,
  jwt,
  loanConfiguration,
  loanUser,
  moment,
  nodemailer,
  path,
  policyPlan,
  policyType,
  property,
  references,
  unit_category_list,
  userCatergory,
  uuidv4,
  vehcileRunningPolicy,
  vehiclePreviousPolicy,
  vehicleUser,
  vehicle_document,
  vehicles
} = require("../shared/context");
const blogService = require("./blog.service");
const logger = require("../../config/logger");

exports.addBlog = async (req, res) => {
    try {
        console.log('🔍 addBlog - Request body:', req.body);
        console.log('🔍 addBlog - Request files:', req.files);
        console.log('🔍 addBlog - Blog model:', Blog);
        console.log('🔍 addBlog - Database connection status:', db.sequelize.authenticate ? 'Connected' : 'Not connected');
        
        const { title, content, author, category, tags, status = 'draft' } = req.body;
        
        // Handle file upload
        let imagePath = 'default-blog-image.jpg'; // Default image filename (just filename, not full path)
        
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadDir = path.join(CTRL_DIR, '../../uploads');
            
            // Ensure upload directory exists using native fs
            if (!fsSync.existsSync(uploadDir)) {
                fsSync.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = `blog-${uniqueSuffix}${path.extname(image.name)}`;
            imagePath = filename; // Store only filename
            
            // Move file to upload directory
            await image.mv(path.join(uploadDir, filename));
        }

        // Handle tags - convert to array if it's a string
        let tagsArray = [];
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                // If parsing fails, treat it as a single tag
                tagsArray = [tags];
            }
        }

        console.log('🔍 addBlog - Creating blog with data:', {
            title,
            content,
            image: imagePath,
            author,
            category,
            tags: tagsArray,
            status,
            created_at: new Date(),
            updated_at: new Date()
        });

        const blog = await Blog.create({
            title,
            content,
            image: imagePath,
            author,
            category,
            tags: tagsArray,
            status,
            created_at: new Date(),
            updated_at: new Date()
        });
        
        console.log('🔍 addBlog - Blog created successfully:', blog.toJSON());
        
        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }
        
        console.log('🔍 addBlog - Returning response:', { message: 'Blog created successfully', blog: blogData });
        return res.status(201).json({ message: 'Blog created successfully', blog: blogData });
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({ 
            message: 'Error creating blog',
            error: error.message 
        });
    }
};


exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author, category, tags, status } = req.body;
        
        const blog = await Blog.findByPk(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Handle file upload if new image is provided
        let imagePath = blog.image; // Keep existing image by default
        
        if (req.files && req.files.image) {
            const image = req.files.image;
            const uploadDir = path.join(CTRL_DIR, '../../uploads');
            
            // Ensure upload directory exists using native fs
            if (!fsSync.existsSync(uploadDir)) {
                fsSync.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = `blog-${uniqueSuffix}${path.extname(image.name)}`;
            imagePath = filename; // Store only filename
            
            // Move file to upload directory
            await image.mv(path.join(uploadDir, filename));
        }

        // Handle tags - convert to array if it's a string
        let tagsArray = blog.tags; // Keep existing tags by default
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                // If parsing fails, treat it as a single tag
                tagsArray = [tags];
            }
        }

        await blog.update({
            title: title || blog.title,
            content: content || blog.content,
            image: imagePath,
            author: author || blog.author,
            category: category || blog.category,
            tags: tagsArray,
            status: status || blog.status,
            updated_at: new Date()
        });

        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }

        return res.status(200).json({ message: 'Blog updated successfully', blog: blogData });
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ message: 'Error updating blog' });
    }
};


exports.deleteBlog = async (req, res) => {
    try {
        const deleted = await blogService.deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        return res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        logger.error({ err: error }, "deleteBlog failed");
        return res.status(500).json({ message: 'Error deleting blog' });
    }
};


exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            order: [['created_at', 'DESC']]
        });
        
        // Add full URL to image paths
        const blogsWithFullImageUrl = blogs.map(blog => {
            const blogData = blog.toJSON();
            if (blogData.image && !blogData.image.startsWith('http')) {
                blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
            }
            return blogData;
        });
        
        return res.status(200).json({
            status: true,
            data: blogsWithFullImageUrl
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({
            status: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};


exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findByPk(id);
        
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Add full URL to image path
        const blogData = blog.toJSON();
        if (blogData.image && !blogData.image.startsWith('http')) {
            blogData.image = `${req.protocol}://${req.get('host')}/uploads/${blogData.image}`;
        }

        return res.status(200).json(blogData);
    } catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).json({ message: 'Error fetching blog' });
    }
};

