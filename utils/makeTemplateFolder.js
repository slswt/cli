module.exports = ({ dir, templateFolder, templateParams }) => {
  if (!dir.match('/microservices/')) {
    console.log(
      'This template can only be used inside the services/microservices of Environments or Blueprints'
    );
    return;
  }

  const templatesRootFolder = join(
    __dirname,
    '../',
    'templates',
    templateFolder
  );
  const globPattern = join(templatesRootFolder, '**/*');
  const sourceFiles = glob.sync(globPattern);

  const newFiles = sourceFiles.map((templateFile) => {
    return {
      src: templateFile,
      dest: join(dir, relative(templatesRootFolder, templateFile)),
    };
  });

  const confirmed = await confirmFileCreation(
    newFiles.map(({ dest }) => dest)
  );

  if (confirmed) {
    newFiles.forEach(({ src, dest }) => {
      const content = evalTemplate(
        src,
        templateParams
      );
      fs.writeFileSync(dest, content);
    });
  }
};
